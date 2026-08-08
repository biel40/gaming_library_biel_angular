import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('GameDetailComponent mobile cover styles', () => {
  const styles = readFileSync(
    resolve(process.cwd(), 'src/app/views/game-detail/game-detail.component.scss'),
    'utf8'
  );
  const template = readFileSync(
    resolve(process.cwd(), 'src/app/views/game-detail/game-detail.component.html'),
    'utf8'
  );

  it('keeps covers fully visible without constraining both dimensions to viewport width', () => {
    const mobileImageStyles = styles.match(
      /\.game-image\s*\{[\s\S]*?@media \(max-width: 767px\)\s*\{([\s\S]*?)\n\s*\}/
    )?.[1];

    expect(mobileImageStyles).toBeDefined();
    expect(mobileImageStyles).toContain('width: 100%');
    expect(mobileImageStyles).toContain('max-width: 520px');
    expect(mobileImageStyles).toContain('max-height: min(60vh, 520px)');
    expect(mobileImageStyles).toContain('object-fit: contain');
    expect(mobileImageStyles).not.toContain('max-height: 55vw');
    expect(mobileImageStyles).not.toContain('max-width: 75%');
  });

  it('does not render empty metadata chips', () => {
    expect(template).toContain('@if (game()?.genre)');
    expect(template).toContain('@if (game()?.platform)');
    expect(template).toContain('@if (game()?.releaseDate)');
  });

  it('uses a compact image edit control on mobile', () => {
    expect(styles).toContain('width: 44px;');
    expect(styles).toContain('height: 44px;');
    expect(styles).toContain('.image-edit-label');
    expect(styles).toContain('display: none;');
  });
});