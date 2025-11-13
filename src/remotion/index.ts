import React from 'react';
import { Composition } from 'remotion';
import { VideoComposition } from './VideoComposition';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="VideoComposition"
				component={VideoComposition}
				durationInFrames={900} // Will be calculated from audio duration
				fps={30}
				width={1080}
				height={1920} // 9:16 aspect ratio for shorts
				defaultProps={{
					scenes: [],
					audioUrl: '',
					words: [],
				}}
			/>
		</>
	);
};

// Export default for Remotion
export default RemotionRoot;

