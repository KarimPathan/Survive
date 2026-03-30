document.addEventListener("DOMContentLoaded", () => {
	const MAX_SCROLL_VH = 800;
	const getMaxScrollY = () =>
		Math.max(0, window.innerHeight * (MAX_SCROLL_VH / 100 - 1));

	const clampScrollY = () => {
		const maxScrollY = getMaxScrollY();
		if (window.scrollY > maxScrollY) {
			window.scrollTo(0, maxScrollY);
		}
	};

	window.addEventListener("scroll", clampScrollY, { passive: true });
	window.addEventListener("resize", clampScrollY);
	window.setTimeout(clampScrollY, 0);

	const verse1 = document.querySelector(".verse1");
	if (!verse1) {
		return;
	}

	const lines = Array.from(verse1.querySelectorAll(".poemtext1"));
	if (lines.length === 0) {
		return;
	}

	const originalText = new Map();

	lines.forEach((line) => {
		originalText.set(line, (line.textContent || "").trim());
		line.textContent = "";
		line.classList.add("is-hidden");
	});

	const surviveLine = lines.find((line) =>
		/we were never meant to survive\.?/i.test(originalText.get(line) || "")
	);

	const forThoseLines = lines.filter((line) =>
		/for those of us/i.test(originalText.get(line) || "")
	);

	const reveal = (line) => {
		if (!line) {
			return;
		}
		line.classList.remove("is-hidden");
		line.classList.add("is-visible");
	};

	const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	const renderLetters = (line, text) => {
		const escaped = text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");

		line.innerHTML = Array.from(escaped)
			.map((character, index) => {
				const safeCharacter = character === " " ? "&nbsp;" : character;
				const dirX = index % 2 === 0 ? 1 : -1;
				const dirY = index % 4 < 2 ? 1 : -1;
				const phase = (index * 3) % 7;
				return `<span class="glitch-letter" style="--i:${index};--dir-x:${dirX};--dir-y:${dirY};--phase:${phase}">${safeCharacter}</span>`;
			})
			.join("");
	};

	const typeLine = async (line, delayPerChar = 14) => {
		if (!line) {
			return;
		}

		const fullText = originalText.get(line) || "";
		reveal(line);

		for (let index = 1; index <= fullText.length; index += 1) {
			renderLetters(line, fullText.slice(0, index));
			await wait(delayPerChar);
		}
	};

	const runRevealSequence = async () => {
		const firstGroup = forThoseLines;
		const lastLine = surviveLine || null;
		const middleGroup = lines.filter(
			(line) => !firstGroup.includes(line) && line !== lastLine
		);
		const linePause = 600;

		await wait(100);
		await Promise.all(firstGroup.map((line) => typeLine(line, 50)));
		await wait(linePause);

		await wait(3000);
		for (const line of middleGroup) {
			await typeLine(line, 50);
			await wait(linePause);
		}

		if (lastLine) {
			await wait(linePause);
			await typeLine(lastLine, 16);
		}
	};

	runRevealSequence();

	const allSpeak = document.querySelector(".allspeak");
	if (allSpeak) {
		allSpeak.addEventListener("click", () => {
			allSpeak.classList.toggle("is-stopped");

			if (allSpeak.classList.contains("is-stopped")) {
				const speakLayers = Array.from(
					allSpeak.querySelectorAll(".speakpink, .speakgreen")
				);
				speakLayers.forEach((layer) => {
					layer.style.top = "0";
				});
			} else {
				const speakLayers = Array.from(
					allSpeak.querySelectorAll(".speakpink, .speakgreen")
				);
				speakLayers.forEach((layer) => {
					layer.style.removeProperty("top");
				});
			}
		});
	}

	const popups = Array.from(document.querySelectorAll(".popup"));
	if (popups.length === 0) {
		return;
	}

	const firstPopup = popups[0];
	const popupTop =
		firstPopup.getBoundingClientRect().top + window.scrollY;
	const triggerPoint = Math.max(0, popupTop - window.innerHeight * 0.6);

	const showPopups = () => {
		popups.forEach((popup) => {
			if (!popup.classList.contains("is-dismissed")) {
				popup.classList.add("is-visible");
			}
		});
	};

	const jitterPopup = (popup) => {
		if (
			!popup ||
			!popup.classList.contains("is-visible") ||
			popup.classList.contains("is-dismissed")
		) {
			return;
		}

		const shiftX = (Math.random() * 22 - 11).toFixed(1);
		const shiftY = (Math.random() * 16 - 8).toFixed(1);
		const popScale = (0.94 + Math.random() * 0.16).toFixed(3);
		const motionDuration = Math.round(500 + Math.random() * 900);

		popup.style.setProperty("--popup-shift-x", `${shiftX}px`);
		popup.style.setProperty("--popup-shift-y", `${shiftY}px`);
		popup.style.setProperty("--popup-pop-scale", popScale);
		popup.style.setProperty("--popup-motion-duration", `${motionDuration}ms`);

		window.setTimeout(() => jitterPopup(popup), motionDuration);
	};

	const startPopupMotion = () => {
		popups.forEach((popup, index) => {
			window.setTimeout(() => jitterPopup(popup), index * 120);
		});
	};

	const phasePopupLoop = (popup) => {
		if (
			!popup ||
			!popup.classList.contains("is-visible") ||
			popup.classList.contains("is-dismissed")
		) {
			return;
		}

		const timeUntilPhaseOut = Math.round(200 + Math.random() * 1200);
		window.setTimeout(() => {
			if (
				!popup.classList.contains("is-visible") ||
				popup.classList.contains("is-dismissed")
			) {
				return;
			}

			popup.classList.add("is-phased-out");
			const hiddenDuration = Math.round(10 + Math.random() * 500);

			window.setTimeout(() => {
				popup.classList.remove("is-phased-out");
				phasePopupLoop(popup);
			}, hiddenDuration);
		}, timeUntilPhaseOut);
	};

	const startPopupPhaseLoop = () => {
		popups.forEach((popup, index) => {
			window.setTimeout(() => phasePopupLoop(popup), 500 + index * 10);
		});
	};

	const enablePopupDismiss = () => {
		popups.forEach((popup) => {
			popup.addEventListener("click", (event) => {
				event.stopPropagation();
				popup.classList.remove("is-visible", "is-phased-out");
				popup.classList.add("is-dismissed");
			});
		});
	};

	enablePopupDismiss();

	const onScroll = () => {
		if (window.scrollY >= triggerPoint) {
			showPopups();
			startPopupMotion();
			startPopupPhaseLoop();
			window.removeEventListener("scroll", onScroll);
		}
	};

	onScroll();
	window.addEventListener("scroll", onScroll);
});

