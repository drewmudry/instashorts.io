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
}

// Caption component that displays words synchronized with audio
const Caption: React.FC<{ words: WordTimestamp[] }> = ({ words }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const currentTime = frame / fps;

	// Get words that should be displayed at the current time
	// Show words that are currently being spoken or were just spoken (within 0.3s)
	const getCaptionBlock = () => {
		const activeWords = words.filter(
			(word) => currentTime >= word.start - 0.3 && currentTime <= word.end + 0.5
		);

		if (activeWords.length === 0) return null;

		// Sort by start time
		activeWords.sort((a, b) => a.start - b.start);

		// Group consecutive words into a caption block
		const block: WordTimestamp[] = [];
		let lastEnd = -1;

		for (const word of activeWords) {
			if (lastEnd === -1 || word.start - lastEnd < 1.0) {
				// Add to current block if it's close to the previous word
				block.push(word);
				lastEnd = word.end;
			} else {
				// Start a new block
				break;
			}
		}

		return block.map((w) => w.word).join(' ');
	};

	const captionText = getCaptionBlock();

	if (!captionText) return null;

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
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					color: 'white',
					padding: '20px 40px',
					borderRadius: 10,
					fontSize: 48,
					fontWeight: 'bold',
					textAlign: 'center',
					maxWidth: '90%',
					lineHeight: 1.4,
					backdropFilter: 'blur(10px)',
				}}
			>
				{captionText}
			</div>
		</AbsoluteFill>
	);
};

// Scene component with zoom/pan effects
const SceneWithEffects: React.FC<{
	imageUrl: string;
	startFrame: number;
	durationInFrames: number;
	effectType: 'zoomIn' | 'zoomOut' | 'panLeft' | 'panRight';
}> = ({ imageUrl, startFrame, durationInFrames, effectType }) => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	// Calculate progress within this scene (0 to 1)
	const sceneProgress =
		(frame - startFrame) / Math.max(durationInFrames, 1);

	// Apply different effects based on type
	let scale = 1;
	let translateX = 0;
	let translateY = 0;

	switch (effectType) {
		case 'zoomIn':
			scale = interpolate(sceneProgress, [0, 1], [1, 1.2], {
				easing: Easing.ease,
			});
			break;
		case 'zoomOut':
			scale = interpolate(sceneProgress, [0, 1], [1.2, 1], {
				easing: Easing.ease,
			});
			break;
		case 'panLeft':
			translateX = interpolate(sceneProgress, [0, 1], [0, -width * 0.1], {
				easing: Easing.ease,
			});
			break;
		case 'panRight':
			translateX = interpolate(sceneProgress, [0, 1], [0, width * 0.1], {
				easing: Easing.ease,
			});
			break;
	}

	return (
		<AbsoluteFill
			style={{
				transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
			}}
		>
			<Img
				src={imageUrl}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
				}}
			/>
		</AbsoluteFill>
	);
};

export const VideoComposition: React.FC<VideoCompositionProps> = ({
	scenes,
	audioUrl,
	words,
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
							startFrame={Math.floor(startFrame)}
							durationInFrames={Math.floor(durationPerScene)}
							effectType={effectType}
						/>
					</Sequence>
				);
			})}

			{/* Captions */}
			<Caption words={words} />
		</AbsoluteFill>
	);
};

