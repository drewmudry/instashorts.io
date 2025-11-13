import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Img,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	Easing,
} from 'remotion';

interface WordTimestamp {
	word: string;
	start: number;
	end: number;
}

interface Scene {
	id: string;
	sceneIndex: number;
	imageUrl: string;
}

interface VideoCompositionProps {
	scenes: Scene[];
	audioUrl: string;
	words: WordTimestamp[];
	captionHighlightColor?: string;
}

// Caption component that displays words synchronized with audio
// Shows multiple words at once, highlights the current word, and has floating animation
const Caption: React.FC<{ 
	words: WordTimestamp[];
	highlightColor?: string;
}> = ({ words, highlightColor = "#FFD700" }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const currentTime = frame / fps;

	if (words.length === 0) return null;
	
	// Don't show captions if we're before the first word or after the last word
	if (currentTime < words[0].start - 0.5 || currentTime > words[words.length - 1].end + 0.5) {
		return null;
	}

	// Use a variable window size between 5-10 words
	// Calculate window size based on available words and timing
	const getWindowSize = (startIndex: number) => {
		const remainingWords = words.length - startIndex;
		// Use 7-8 words as a good default, but adjust based on remaining words
		if (remainingWords >= 10) {
			return 8; // Use 8 words when we have plenty
		} else if (remainingWords >= 7) {
			return 7; // Use 7 words when we have enough
		} else {
			return Math.min(remainingWords, 5); // Use at least 5, or whatever is left
		}
	};

	// Find which word is currently being spoken
	const getCurrentSpokenWordIndex = () => {
		for (let i = 0; i < words.length; i++) {
			if (currentTime >= words[i].start && currentTime <= words[i].end) {
				return i;
			}
		}
		return -1; // No word currently being spoken
	};

	const currentSpokenWordIndex = getCurrentSpokenWordIndex();

	// Determine the window of words to show
	// The window advances when the last word in the current window finishes
	const getWindowStartIndex = () => {
		let windowStart = 0;
		
		// Find the correct window by checking when the last word of each potential window has finished
		for (let i = 0; i < words.length; i++) {
			const windowSize = getWindowSize(i);
			const windowEndIndex = i + windowSize - 1;
			
			if (windowEndIndex >= words.length) {
				// Not enough words left, use this window
				break;
			}
			
			const windowEndWord = words[windowEndIndex];
			
			// If the last word of this window has finished, we can advance to the next window
			if (currentTime > windowEndWord.end) {
				windowStart = i + 1;
			} else {
				// We've found the correct window - the last word hasn't finished yet
				break;
			}
		}
		
		// Ensure we don't go past the end
		const finalWindowSize = getWindowSize(windowStart);
		return Math.min(windowStart, Math.max(0, words.length - finalWindowSize));
	};

	const windowStartIndex = getWindowStartIndex();
	const windowSize = getWindowSize(windowStartIndex);
	const wordsToShow = words.slice(windowStartIndex, windowStartIndex + windowSize);
	
	if (wordsToShow.length === 0) return null;

	// Calculate floating animation (float in/out)
	// Float in when first word of window starts, float out when last word of window ends
	const firstWordStart = wordsToShow[0].start;
	const lastWordEnd = wordsToShow[wordsToShow.length - 1].end;
	const floatInDuration = 0.3; // 0.3 seconds to float in
	const floatOutDuration = 0.3; // 0.3 seconds to float out
	
	let translateY = 0;
	let opacity = 1;

	// Only show the window if we're within its time range
	if (currentTime < firstWordStart || currentTime > lastWordEnd) {
		// Window hasn't started yet or has completely finished - don't show it
		opacity = 0;
	} else if (currentTime >= firstWordStart && currentTime < firstWordStart + floatInDuration) {
		// Float in
		const progress = (currentTime - firstWordStart) / floatInDuration;
		translateY = interpolate(progress, [0, 1], [30, 0], {
			easing: Easing.out(Easing.ease),
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
		opacity = interpolate(progress, [0, 1], [0, 1], {
			easing: Easing.out(Easing.ease),
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	} else if (currentTime > lastWordEnd - floatOutDuration && currentTime <= lastWordEnd) {
		// Float out
		const progress = (currentTime - (lastWordEnd - floatOutDuration)) / floatOutDuration;
		translateY = interpolate(progress, [0, 1], [0, -30], {
			easing: Easing.in(Easing.ease),
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
		opacity = interpolate(progress, [0, 1], [1, 0], {
			easing: Easing.in(Easing.ease),
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	}

	return (
		<AbsoluteFill
			style={{
				justifyContent: 'flex-end',
				alignItems: 'center',
				paddingBottom: 100,
				zIndex: 10,
			}}
		>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					alignItems: 'center',
					gap: '8px',
					padding: '20px 40px',
					maxWidth: '90%',
					opacity,
					transform: `translateY(${translateY}px)`,
					transition: 'opacity 0.1s, transform 0.1s',
				}}
			>
				{wordsToShow.map((word, index) => {
					// Calculate the actual word index in the full words array
					const actualWordIndex = windowStartIndex + index;
					// Check if this word is currently being spoken
					const isCurrentWord = actualWordIndex === currentSpokenWordIndex;
					
					return (
						<span
							key={`${word.word}-${word.start}-${actualWordIndex}`}
							style={{
								color: isCurrentWord ? highlightColor : 'white',
								fontSize: 48,
								fontWeight: 'bold',
								textShadow: `
									-2px -2px 0 #000,
									2px -2px 0 #000,
									-2px 2px 0 #000,
									2px 2px 0 #000,
									0 0 4px #000,
									0 0 4px #000
								`,
								transition: 'color 0.15s ease',
							}}
						>
							{word.word}
						</span>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// Scene component with zoom/pan effects
const SceneWithEffects: React.FC<{
	imageUrl: string;
	durationInFrames: number;
	effectType: 'zoomIn' | 'zoomOut' | 'panLeft' | 'panRight';
}> = ({ imageUrl, durationInFrames, effectType }) => {
	const frame = useCurrentFrame(); // This is relative to the Sequence, not global
	const { width } = useVideoConfig();

	// Clamp progress to [0, 1] to prevent animation glitches
	const progress = Math.min(1, Math.max(0, frame / Math.max(durationInFrames, 1)));

	// Apply effects with safer interpolation and clamping
	let transform = '';

	switch (effectType) {
		case 'zoomIn':
			const zoomInScale = interpolate(progress, [0, 1], [1.0, 1.15], {
				easing: Easing.out(Easing.quad),
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			});
			transform = `scale(${zoomInScale})`;
			break;
		case 'zoomOut':
			const zoomOutScale = interpolate(progress, [0, 1], [1.15, 1.0], {
				easing: Easing.out(Easing.quad),
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			});
			transform = `scale(${zoomOutScale})`;
			break;
		case 'panLeft':
			const panLeftX = interpolate(progress, [0, 1], [0, -width * 0.08], {
				easing: Easing.out(Easing.quad),
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			});
			transform = `translateX(${panLeftX}px) scale(1.1)`;
			break;
		case 'panRight':
			const panRightX = interpolate(progress, [0, 1], [0, width * 0.08], {
				easing: Easing.out(Easing.quad),
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			});
			transform = `translateX(${panRightX}px) scale(1.1)`;
			break;
	}

	return (
		<AbsoluteFill
			style={{
				overflow: 'hidden', // Prevent images from showing outside bounds
			}}
		>
			<Img
				src={imageUrl}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform,
					transformOrigin: 'center center',
				}}
			/>
		</AbsoluteFill>
	);
};

export const VideoComposition: React.FC<VideoCompositionProps> = ({
	scenes,
	audioUrl,
	words,
	captionHighlightColor,
}) => {
	const { durationInFrames, fps } = useVideoConfig();

	// Calculate duration per scene (equally distributed)
	const durationPerScene = durationInFrames / scenes.length;

	// Effect types to cycle through
	const effects: Array<'zoomIn' | 'zoomOut' | 'panLeft' | 'panRight'> = [
		'zoomIn',
		'zoomOut',
		'panLeft',
		'panRight',
	];

	return (
		<AbsoluteFill style={{ backgroundColor: '#000' }}>
			{/* Audio */}
			<Audio src={audioUrl} />

			{/* Scenes with effects */}
			{scenes.map((scene, index) => {
				const startFrame = index * durationPerScene;
				const effectType = effects[index % effects.length];

				return (
					<Sequence
						key={scene.id}
						from={Math.floor(startFrame)}
						durationInFrames={Math.floor(durationPerScene)}
					>
						<SceneWithEffects
							imageUrl={scene.imageUrl}
							durationInFrames={Math.floor(durationPerScene)}
							effectType={effectType}
						/>
					</Sequence>
				);
			})}

			{/* Captions */}
			<Caption words={words} highlightColor={captionHighlightColor} />
		</AbsoluteFill>
	);
};

