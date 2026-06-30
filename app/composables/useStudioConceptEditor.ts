import type {
	StudioConcept,
	StudioConceptFormat,
	StudioConceptListMutationResponse,
	StudioConceptMutationResponse,
	StudioConceptResponse,
	StudioProjectResponse,
	StudioVariant,
} from "../../shared/types/studio";

interface ConceptMutationOptions {
	persist?: boolean;
}

export async function useStudioConceptEditor() {
	const route = useRoute();
	const router = useRouter();
	const {
		projectSlug,
		brief,
		concepts,
		isGeneratingConcepts,
		generationMessage,
		setProject,
	} = useStudioSession();

	const pending = ref(isGeneratingConcepts.value && !concepts.value.length);
	const initialLoadError = ref("");
	const variantLoadingKeys = ref<Record<string, boolean>>({});
	const pendingFormatsLoading = ref<Record<string, boolean>>({});
	const conceptMutationQueue = ref<Record<string, Promise<void>>>({});
	const promptDrafts = ref<Record<string, string>>({});
	const promptModalConceptId = ref<string | null>(null);
	const modalPromptDraft = ref("");
	const moreConceptCount = ref(1);
	const loadingMoreConcepts = ref(false);
	const loadingExport = ref(false);
	const extraConceptCounts = [1, 2, 3, 4];
	const focusedConceptId = ref<string | null>(null);
	const routeParamSlug = computed(() =>
		typeof route.params.slug === "string" ? route.params.slug : "",
	);
	const routeProjectSlug = computed(
		() => routeParamSlug.value || projectSlug.value,
	);

	if (!routeProjectSlug.value) {
		await router.replace("/studio");
	}

	if (routeParamSlug.value) {
		const response = await $fetch<StudioProjectResponse>(
			`/api/studio/projects/${routeParamSlug.value}`,
		);

		setProject(response.project);
	}

	if (concepts.value.length) {
		isGeneratingConcepts.value = false;
		generationMessage.value = "";
	}

	void ensureInitialConcepts();
	syncPromptDrafts(concepts.value);

	watch(
		concepts,
		(nextConcepts) => {
			syncPromptDrafts(nextConcepts);
		},
		{ deep: true },
	);

	watch(
		() => [route.query.concept, route.query.ratio, route.query.variant],
		async () => {
			await applyLibraryFocusFromRoute();
		},
		{ immediate: true },
	);

	const hasExportableConcepts = computed(() =>
		concepts.value.some((concept) => {
			return concept.formats.some((format) => {
				const variant = activeVariantForFormat(format);

				return variant?.mode === "final" && Boolean(variant.imageUrl);
			});
		}),
	);

	const promptModalConcept = computed(() => {
		return (
			concepts.value.find(
				(concept) => concept.id === promptModalConceptId.value,
			) || null
		);
	});

	const canEditPromptInModal = computed(() => {
		if (!promptModalConcept.value) {
			return false;
		}

		return Boolean(selectedFormat(promptModalConcept.value));
	});

	const promptModalDescription = computed(() => {
		if (!promptModalConcept.value) {
			return "";
		}

		const format = selectedFormat(promptModalConcept.value);

		if (!format) {
			return "";
		}

		return format.variants.length
			? "Edita el prompt del formato. Se usara en la siguiente regeneracion."
			: "Edita el prompt antes de generar este formato.";
	});

	async function ensureInitialConcepts() {
		if (
			concepts.value.length ||
			!brief.value.projectName ||
			!routeProjectSlug.value
		) {
			return;
		}

		pending.value = true;
		initialLoadError.value = "";
		isGeneratingConcepts.value = true;
		generationMessage.value =
			"Gemini esta redactando conceptos base para este brief.";

		try {
			generationMessage.value =
				"Generando conceptos y el primer arte de cada propuesta...";
			const response = await $fetch<StudioConceptResponse>(
				"/api/studio/concepts",
				{
					method: "POST",
					body: {
						projectSlug: routeProjectSlug.value,
						brief: brief.value,
					},
				},
			);

			concepts.value = response.concepts;
			generationMessage.value = "";
			isGeneratingConcepts.value = false;
		} catch {
			initialLoadError.value =
				"No pudimos generar los conceptos iniciales. Revisa la configuracion de Gemini e intentalo de nuevo.";
			generationMessage.value = "";
			isGeneratingConcepts.value = false;
		} finally {
			pending.value = false;
		}
	}

	function syncPromptDrafts(nextConcepts: StudioConcept[]) {
		const drafts = { ...promptDrafts.value };

		nextConcepts.forEach((concept) => {
			const format = selectedFormat(concept);

			if (!drafts[concept.id]) {
				drafts[concept.id] = format?.promptDraft || "";
			}
		});

		promptDrafts.value = drafts;
	}

	async function applyLibraryFocusFromRoute() {
		const conceptId =
			typeof route.query.concept === "string" ? route.query.concept : "";
		const ratio =
			typeof route.query.ratio === "string" ? route.query.ratio : "";
		const variantId =
			typeof route.query.variant === "string" ? route.query.variant : "";

		if (!conceptId) {
			focusedConceptId.value = null;
			return;
		}

		const concept = concepts.value.find((item) => item.id === conceptId);

		if (!concept) {
			return;
		}

		focusedConceptId.value = conceptId;

		if (ratio && concept.formats.some((format) => format.ratio === ratio)) {
			selectRatio(conceptId, ratio);
		}

		if (ratio && variantId) {
			const format = concept.formats.find((item) => item.ratio === ratio);

			if (format?.variants.some((variant) => variant.id === variantId)) {
				selectVariant(conceptId, ratio, variantId, { persist: false });
			}
		}

		await nextTick();
		document
			.getElementById(`concept-${conceptId}`)
			?.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function selectedFormat(
		concept: StudioConcept,
	): StudioConceptFormat | undefined {
		return concept.formats.find(
			(format) => format.ratio === concept.selectedRatio,
		);
	}

	function activeVariant(concept: StudioConcept): StudioVariant | undefined {
		const format = selectedFormat(concept);

		return format?.variants.find(
			(variant) => variant.id === format.activeVariantId,
		);
	}

	function activeVariantForFormat(
		format: StudioConceptFormat,
	): StudioVariant | undefined {
		return format.variants.find(
			(variant) => variant.id === format.activeVariantId,
		);
	}

	function activeVariantsByRatio(concept: StudioConcept) {
		return Object.fromEntries(
			concept.formats.map((format) => [
				format.ratio,
				activeVariantForFormat(format),
			]),
		);
	}

	function createFormatKey(conceptId: string, ratio: string) {
		return `${conceptId}:${ratio}`;
	}

	function setLoadingKey(
		target: typeof variantLoadingKeys,
		key: string,
		value: boolean,
	) {
		target.value = value
			? { ...target.value, [key]: true }
			: Object.fromEntries(
					Object.entries(target.value).filter(([entryKey]) => entryKey !== key),
				);
	}

	function updateConcept(
		conceptId: string,
		updater: (concept: StudioConcept) => StudioConcept,
	) {
		concepts.value = concepts.value.map((concept) =>
			concept.id === conceptId ? updater(concept) : concept,
		);
	}

	function replaceConcept(nextConcept: StudioConcept) {
		updateConcept(nextConcept.id, (currentConcept) => {
			const selectedRatio = nextConcept.formats.some(
				(format) => format.ratio === currentConcept.selectedRatio,
			)
				? currentConcept.selectedRatio
				: nextConcept.selectedRatio;

			return {
				...nextConcept,
				selectedRatio,
			};
		});
	}

	function enqueueConceptMutation(
		conceptId: string,
		task: () => Promise<void>,
	) {
		const currentTask =
			conceptMutationQueue.value[conceptId] || Promise.resolve();
		const nextTask = currentTask.catch(() => undefined).then(task);

		conceptMutationQueue.value = {
			...conceptMutationQueue.value,
			[conceptId]: nextTask,
		};

		return nextTask.finally(() => {
			if (conceptMutationQueue.value[conceptId] !== nextTask) {
				return;
			}

			conceptMutationQueue.value = Object.fromEntries(
				Object.entries(conceptMutationQueue.value).filter(
					([key]) => key !== conceptId,
				),
			);
		});
	}

	function isVariantLoading(conceptId: string, ratio: string) {
		return Boolean(variantLoadingKeys.value[createFormatKey(conceptId, ratio)]);
	}

	function isPendingFormatsLoading(conceptId: string) {
		return Boolean(pendingFormatsLoading.value[conceptId]);
	}

	function selectRatio(conceptId: string, ratio: string) {
		updateConcept(conceptId, (concept) => {
			const format = concept.formats.find((item) => item.ratio === ratio);

			promptDrafts.value[concept.id] = format?.promptDraft || "";

			return {
				...concept,
				selectedRatio: ratio,
			};
		});
	}

	function cycleRatio(conceptId: string) {
		const concept = concepts.value.find((item) => item.id === conceptId);

		if (!concept) {
			return;
		}

		const currentIndex = concept.formats.findIndex(
			(format) => format.ratio === concept.selectedRatio,
		);
		const nextIndex =
			currentIndex === concept.formats.length - 1 ? 0 : currentIndex + 1;

		selectRatio(
			conceptId,
			concept.formats[nextIndex]?.ratio || concept.selectedRatio,
		);
	}

	function resetPrompt(conceptId: string) {
		const concept = concepts.value.find((item) => item.id === conceptId);
		const format = concept ? selectedFormat(concept) : null;

		if (!concept || !format) {
			return;
		}

		promptDrafts.value[conceptId] = format.promptDraft;

		if (promptModalConceptId.value === conceptId) {
			modalPromptDraft.value = format.promptDraft;
		}
	}

	function selectVariant(
		conceptId: string,
		ratio: string,
		variantId: string,
		options: ConceptMutationOptions = {},
	) {
		updateConcept(conceptId, (concept) => ({
			...concept,
			selectedRatio: ratio,
			formats: concept.formats.map((format) => {
				if (format.ratio !== ratio) {
					return format;
				}

				const variant = format.variants.find((item) => item.id === variantId);
				promptDrafts.value[concept.id] = variant?.prompt || format.promptDraft;

				return {
					...format,
					activeVariantId: variantId,
				};
			}),
		}));

		if (options.persist !== false) {
			void enqueueConceptMutation(conceptId, () =>
				persistSelectedVariant(conceptId, ratio, variantId),
			);
		}
	}

	async function regenerateVariant(conceptId: string) {
		const concept = concepts.value.find((item) => item.id === conceptId);
		const format = concept ? selectedFormat(concept) : null;

		if (!concept || !format || !format.variants.length) {
			return;
		}

		const loadingKey = createFormatKey(conceptId, concept.selectedRatio);

		setLoadingKey(variantLoadingKeys, loadingKey, true);

		try {
			const prompt = promptDrafts.value[conceptId];
			const response = await $fetch<StudioConceptMutationResponse>(
				"/api/studio/regenerate-variant",
				{
					method: "POST",
					body: {
						projectSlug: routeProjectSlug.value,
						conceptId,
						ratio: concept.selectedRatio,
						prompt,
					},
				},
			);

			replaceConcept(response.concept);
		} finally {
			setLoadingKey(variantLoadingKeys, loadingKey, false);
		}
	}

	async function generatePendingFormats(conceptId: string) {
		const concept = concepts.value.find((item) => item.id === conceptId);

		if (!concept) {
			return;
		}

		pendingFormatsLoading.value = {
			...pendingFormatsLoading.value,
			[conceptId]: true,
		};

		try {
			const response = await $fetch<StudioConceptMutationResponse>(
				"/api/studio/generate-pending-formats",
				{
					method: "POST",
					body: {
						projectSlug: routeProjectSlug.value,
						conceptId,
					},
				},
			);

			replaceConcept(response.concept);
		} finally {
			pendingFormatsLoading.value = Object.fromEntries(
				Object.entries(pendingFormatsLoading.value).filter(
					([key]) => key !== conceptId,
				),
			);
		}
	}

	function formatTimestamp(value: string) {
		return new Intl.DateTimeFormat("es-ES", {
			day: "2-digit",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date(value));
	}

	function discardConcept(conceptId: string) {
		concepts.value = concepts.value.filter(
			(concept) => concept.id !== conceptId,
		);

		if (promptModalConceptId.value === conceptId) {
			closePromptModal();
		}

		delete promptDrafts.value[conceptId];

		void enqueueConceptMutation(conceptId, () =>
			persistDiscardedConcept(conceptId),
		);
	}

	async function generateMoreConcepts() {
		if (!routeProjectSlug.value) {
			return;
		}

		loadingMoreConcepts.value = true;

		try {
			const response = await $fetch<StudioConceptResponse>(
				`/api/studio/projects/${routeProjectSlug.value}/concepts/append`,
				{
					method: "POST",
					body: {
						count: moreConceptCount.value,
					},
				},
			);

			concepts.value = [...concepts.value, ...response.concepts];
		} finally {
			loadingMoreConcepts.value = false;
		}
	}

	async function useConceptStyleForNextGenerations(conceptId: string) {
		if (!routeProjectSlug.value) {
			return;
		}

		const concept = concepts.value.find((item) => item.id === conceptId);

		if (!concept || !concept.creativeStyleId) {
			return;
		}

		const nextBrief = {
			...brief.value,
			styleGuideId: null,
			creativeStyleId: concept.creativeStyleId,
		};

		const response = await $fetch<StudioProjectResponse>(
			`/api/studio/projects/${routeProjectSlug.value}/brief`,
			{
				method: "PUT",
				body: {
					brief: nextBrief,
				},
			},
		);

		setProject(response.project);
	}

	async function exportConcepts() {
		if (
			!routeProjectSlug.value ||
			loadingExport.value ||
			!hasExportableConcepts.value
		) {
			return;
		}

		loadingExport.value = true;

		try {
			const response = await $fetch.raw(
				`/api/studio/projects/${routeProjectSlug.value}/export`,
				{
					method: "GET",
					responseType: "blob",
				},
			);
			const blob = response._data;

			if (!(blob instanceof Blob)) {
				throw new Error("No se pudo preparar el ZIP de exportacion.");
			}

			const objectUrl = URL.createObjectURL(blob);
			const contentDisposition =
				response.headers.get("content-disposition") || "";
			const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/i);
			const fileName = fileNameMatch?.[1] || "conceptos.zip";
			const link = document.createElement("a");

			link.href = objectUrl;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(objectUrl);
		} catch (error) {
			console.error(error);
			alert("No pudimos exportar las imagenes activas del studio.");
		} finally {
			loadingExport.value = false;
		}
	}

	function openPromptModal(conceptId: string) {
		promptModalConceptId.value = conceptId;
		modalPromptDraft.value = promptDrafts.value[conceptId] || "";
	}

	function closePromptModal() {
		promptModalConceptId.value = null;
		modalPromptDraft.value = "";
	}

	function savePromptModal() {
		if (!promptModalConceptId.value || !canEditPromptInModal.value) {
			return;
		}

		const conceptId = promptModalConceptId.value;
		const promptDraft = modalPromptDraft.value;
		const concept = concepts.value.find((item) => item.id === conceptId);
		const ratio = concept?.selectedRatio;

		promptDrafts.value[conceptId] = promptDraft;

		updateConcept(conceptId, (concept) => ({
			...concept,
			formats: concept.formats.map((format) => {
				if (format.ratio !== concept.selectedRatio) {
					return format;
				}

				return {
					...format,
					promptDraft,
				};
			}),
		}));

		closePromptModal();

		if (ratio) {
			void enqueueConceptMutation(conceptId, () =>
				persistPromptDraft(conceptId, ratio, promptDraft),
			);
		}
	}

	function promptPreview(conceptId: string) {
		const value = promptDrafts.value[conceptId] || "";

		if (!value) {
			return "Sin prompt disponible.";
		}

		return value.length > 240 ? `${value.slice(0, 240)}...` : value;
	}

	async function persistSelectedVariant(
		conceptId: string,
		ratio: string,
		activeVariantId: string,
	) {
		if (!routeProjectSlug.value) {
			return;
		}

		await $fetch<{ ok: true }>(
			`/api/studio/projects/${routeProjectSlug.value}/concepts/select-variant`,
			{
				method: "PUT",
				body: {
					conceptId,
					ratio,
					activeVariantId,
				},
			},
		);
	}

	async function persistPromptDraft(
		conceptId: string,
		ratio: string,
		promptDraft: string,
	) {
		if (!routeProjectSlug.value) {
			return;
		}

		const response = await $fetch<StudioConceptMutationResponse>(
			`/api/studio/projects/${routeProjectSlug.value}/concepts/prompt`,
			{
				method: "PUT",
				body: {
					conceptId,
					ratio,
					promptDraft,
				},
			},
		);

		replaceConcept(response.concept);
	}

	async function persistDiscardedConcept(conceptId: string) {
		if (!routeProjectSlug.value) {
			return;
		}

		const response = await $fetch<StudioConceptListMutationResponse>(
			`/api/studio/projects/${routeProjectSlug.value}/concepts/discard`,
			{
				method: "PUT",
				body: {
					conceptId,
				},
			},
		);

		concepts.value = response.concepts;
	}

	function formatStatusLabel(
		_concept: StudioConcept,
		format: StudioConceptFormat,
	) {
		const variant = activeVariantForFormat(format);

		if (variant?.mode === "final") {
			return "Generado";
		}

		if (variant?.mode === "preview") {
			return "Preview legado";
		}

		return "Pendiente";
	}

	return {
		brief,
		concepts,
		generationMessage,
		pending,
		initialLoadError,
		isVariantLoading,
		isPendingFormatsLoading,
		promptDrafts,
		promptModalConceptId,
		modalPromptDraft,
		moreConceptCount,
		loadingMoreConcepts,
		loadingExport,
		extraConceptCounts,
		routeProjectSlug,
		focusedConceptId,
		hasExportableConcepts,
		promptModalConcept,
		canEditPromptInModal,
		promptModalDescription,
		selectedFormat,
		activeVariant,
		activeVariantForFormat,
		activeVariantsByRatio,
		selectRatio,
		cycleRatio,
		resetPrompt,
		selectVariant,
		regenerateVariant,
		generatePendingFormats,
		formatTimestamp,
		discardConcept,
		generateMoreConcepts,
		useConceptStyleForNextGenerations,
		exportConcepts,
		openPromptModal,
		closePromptModal,
		savePromptModal,
		promptPreview,
		formatStatusLabel,
	};
}
