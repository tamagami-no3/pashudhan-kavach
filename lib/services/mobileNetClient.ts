'use client';

export interface VisualSignal {
  className: string;
  probability: number;
}

let modelPromise: Promise<any> | null = null;

/**
 * Lazy loads MobileNet model in the browser environment.
 * Ensures zero SSR issues by dynamically importing @tensorflow/tfjs and @tensorflow-models/mobilenet.
 */
async function getMobileNetModel() {
  if (typeof window === 'undefined') return null;

  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        const mobilenet = await import('@tensorflow-models/mobilenet');
        // Load lightweight MobileNet v2 with alpha 1.0
        return await mobilenet.load({ version: 2, alpha: 1.0 });
      } catch (err) {
        console.warn('Failed to load MobileNet model on client:', err);
        return null;
      }
    })();
  }

  return modelPromise;
}

/**
 * Runs client-side MobileNet inference on an HTML image or canvas element.
 * Extracts top-3 predicted visual classes and probabilities.
 * Pretrained general model — NOT a disease classifier.
 */
export async function runMobileNetInference(
  imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<VisualSignal[]> {
  try {
    const model = await getMobileNetModel();
    if (!model) return [];

    const predictions = await model.classify(imageElement, 3);
    return (predictions || []).map((p: any) => ({
      className: p.className,
      probability: Math.round(Number(p.probability) * 100) / 100,
    }));
  } catch (err) {
    console.warn('MobileNet classification error:', err);
    return [];
  }
}

