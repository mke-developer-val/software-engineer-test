import { HeadingAnalyzerService } from './HeadingAnalyzerService';

describe('HeadingAnalyzerService', () => {
  let service: HeadingAnalyzerService;

  beforeEach(() => {
    service = new HeadingAnalyzerService();
  });

  test('should analyze simple heading sequence', () => {
    const html = `
      <html>
        <body>
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
        </body>
      </html>
    `;

    const result = service.analyzeHtml(html);

    expect(result['semantic-structure']).toHaveLength(1);
    expect(result['semantic-structure'][0].tag).toBe('h1');
    expect(result['semantic-structure'][0].children).toHaveLength(1);
    expect(result['semantic-structure'][0].children[0].tag).toBe('h2');
    expect(result['skipped-levels']).toHaveLength(0);
  });

  test('should detect skipped levels', () => {
    const html = `
      <html>
        <body>
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h5>Heading 5</h5>
        </body>
      </html>
    `;

    const result = service.analyzeHtml(html);

    expect(result['skipped-levels']).toHaveLength(1);
    expect(result['skipped-levels'][0][0].tag).toBe('h2');
    expect(result['skipped-levels'][0][1].tag).toBe('h5');
  });

  test('should handle multiple roots', () => {
    const html = `
      <html>
        <body>
          <h1>First Root</h1>
          <h2>Child of First</h2>
          <h1>Second Root</h1>
          <h2>Child of Second</h2>
        </body>
      </html>
    `;

    const result = service.analyzeHtml(html);

    expect(result['semantic-structure']).toHaveLength(2);
    expect(result['semantic-structure'][0].content).toBe('First Root');
    expect(result['semantic-structure'][1].content).toBe('Second Root');
  });

  test('should detect incongruent headings', () => {
    const html = `
      <html>
        <body>
          <section>
            <h4>Heading 4</h4>
            <section>
              <section>
                <h2>Heading 2</h2>
              </section>
            </section>
          </section>
        </body>
      </html>
    `;

    const result = service.analyzeHtml(html);

    expect(result['incongruent-headings'].length).toBeGreaterThan(0);
    const incongruent = result['incongruent-headings'].find(h => h.tag === 'h2');
    expect(incongruent).toBeDefined();
  });

  test('should calculate DOM depth correctly', () => {
    const html = `
      <html>
        <body>
          <div>
            <section>
              <article>
                <h1>Deep Heading</h1>
              </article>
            </section>
          </div>
        </body>
      </html>
    `;

    const result = service.analyzeHtml(html);

    // DOM depth should be 3 (div, section, article)
    expect(result['semantic-structure']).toHaveLength(1);
  });

  test('should handle empty children arrays', () => {
    const html = `
      <html>
        <body>
          <h1>Only Heading</h1>
        </body>
      </html>
    `;

    const result = service.analyzeHtml(html);

    expect(result['semantic-structure'][0].children).toEqual([]);
  });

  test('should handle problem statement example', () => {
    const html = `
      <section>
        <h1>Heading 1</h1>
        <section>
          <h2>Heading 2</h2>
          <h2>Another Heading 2</h2>
          <section>
            <h3>Heading 3</h3>
            <section>
              <h4>Heading 4</h4>
              <section>
                <h2>An out of place Heading 2</h2>
                <h5>Heading 5</h5>
              </section>
            </section>
          </section>
        </section>
      </section>
    `;

    const result = service.analyzeHtml(html);

    // Should have 1 root (h1)
    expect(result['semantic-structure']).toHaveLength(1);

    // Should detect skipped level (h2 -> h5)
    const skippedPair = result['skipped-levels'].find(
      pair => pair[0].tag === 'h2' && pair[1].tag === 'h5'
    );
    expect(skippedPair).toBeDefined();

    // Should detect incongruent heading (out of place h2)
    const incongruent = result['incongruent-headings'].find(
      h => h.content === 'An out of place Heading 2'
    );
    expect(incongruent).toBeDefined();
  });
});
