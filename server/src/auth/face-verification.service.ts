import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Jimp } from 'jimp';

@Injectable()
export class FaceVerificationService {
  private readonly allowedPrefixes = [
    'data:image/jpeg;base64,',
    'data:image/png;base64,',
  ];
  private readonly hammingThreshold = 10;

  private normalizeDataUrl(imageBase64: string): string {
    const prefix = this.allowedPrefixes.find((item) =>
      imageBase64.startsWith(item),
    );
    if (!prefix) {
      throw new UnauthorizedException(
        'Invalid face image format. Capture with the in-app camera.',
      );
    }
    return imageBase64.slice(prefix.length);
  }

  private toBinaryHash(hexHash: string): string {
    return [...hexHash]
      .map((hex) => Number.parseInt(hex, 16).toString(2).padStart(4, '0'))
      .join('');
  }

  private hammingDistance(hashA: string, hashB: string): number {
    let diff = 0;
    for (let index = 0; index < hashA.length; index += 1) {
      if (hashA[index] !== hashB[index]) diff += 1;
    }
    return diff;
  }

  async computeFacePrint(imageBase64: string): Promise<string> {
    const normalizedBase64 = this.normalizeDataUrl(imageBase64);
    const imageBuffer = Buffer.from(normalizedBase64, 'base64');
    const image = await Jimp.read(imageBuffer);
    image.resize({ w: 32, h: 32 }).greyscale();
    return image.hash();
  }

  async compare(
    capturedFace: string,
    savedFacePrint: string,
  ): Promise<boolean> {
    const currentPrint = await this.computeFacePrint(capturedFace);
    const currentBinary = this.toBinaryHash(currentPrint);
    const savedBinary = this.toBinaryHash(savedFacePrint);
    const distance = this.hammingDistance(currentBinary, savedBinary);
    return distance <= this.hammingThreshold;
  }
}
