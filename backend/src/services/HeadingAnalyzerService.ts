import * as cheerio from 'cheerio';
import axios from 'axios';
import { HeadingNode, AnalysisResult, HeadingInfo } from '../models/HeadingNode';

/**
 * Service for analyzing heading structure in HTML documents.
 *
 */
export class HeadingAnalyzerService {
  private static readonly CONNECTION_TIMEOUT = 10000; // 10 seconds

  /**
   * Analyzes the heading structure of a web page at the given URL.
   */
  async analyzeUrl(url: string): Promise<AnalysisResult> {
    // Validate URL
    if (!url || url.trim().length === 0) {
      throw new Error('URL cannot be null or empty');
    }

    // Fetch the HTML
    let html: string;
    try {
      const response = await axios.get(url, {
        timeout: HeadingAnalyzerService.CONNECTION_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HeadingChecker/1.0)'
        }
      });
      html = response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch URL: ${url} - ${error.message}`);
      }
      throw error;
    }

    return this.analyzeHtml(html);
  }

  /**
   * Analyzes HTML content
   */
  analyzeHtml(html: string): AnalysisResult {
    const $ = cheerio.load(html);

    // Extract all headings with their DOM depth
    const headings = this.extractHeadings($);

    // Build semantic tree and detect skipped levels
    const result: AnalysisResult = {
      'semantic-structure': [],
      'skipped-levels': [],
      'incongruent-headings': []
    };

    const roots = this.buildSemanticTree(headings, result);
    result['semantic-structure'] = roots;

    // Detect incongruent headings
    this.detectIncongruentHeadings(headings, result);

    return result;
  }

  /**
   * Extracts all heading elements (h1-h6) from the document with their DOM nesting depth.
   */
  private extractHeadings($: any): HeadingInfo[] {
    const headings: HeadingInfo[] = [];
    const headingElements = $('h1, h2, h3, h4, h5, h6');

    headingElements.each((_: any, element: any) => {
      const $el = $(element);
      const tag = element.type === 'tag' ? element.name.toLowerCase() : '';
      const content = $el.text().trim();

      const node: HeadingNode = {
        tag,
        content,
        children: []
      };

      const domDepth = this.calculateDomDepth($, element);
      const level = this.getLevel(tag);

      headings.push({
        node,
        domDepth,
        level
      });
    });

    return headings;
  }

  /**
   * Calculates the DOM nesting depth by counting ancestor sectioning elements
   * (section, article, aside, nav, div).
   */
  private calculateDomDepth($: any, element: any): number {
    let depth = 0;
    let parent = $(element).parent();

    while (parent.length > 0 && parent[0] && parent[0].type === 'tag') {
      const parentElement = parent[0] as any;
      const tagName = parentElement.name?.toLowerCase();
      if (tagName === 'section' || tagName === 'article' ||
          tagName === 'aside' || tagName === 'nav' ||
          tagName === 'div') {
        depth++;
      }
      parent = parent.parent();
    }

    return depth;
  }

  /**
   * Gets the heading level as an integer (1-6).
   */
  private getLevel(tag: string): number {
    if (!tag || !tag.startsWith('h')) {
      return 0;
    }
    return parseInt(tag.substring(1), 10) || 0;
  }

  /**
   * Creates a shallow copy (without children) for inclusion in results.
   */
  private shallowCopy(node: HeadingNode): HeadingNode {
    return {
      tag: node.tag,
      content: node.content,
      children: []
    };
  }

  /**
   * Builds the semantic tree structure based on heading levels.
   */
  private buildSemanticTree(headings: HeadingInfo[], result: AnalysisResult): HeadingNode[] {
    const roots: HeadingNode[] = [];
    const stack: HeadingNode[] = [];

    for (const info of headings) {
      const current = info.node;
      const currentLevel = info.level;

      // Pop stack until we find a valid parent (level < currentLevel)
      while (stack.length > 0 && this.getLevel(stack[stack.length - 1].tag) >= currentLevel) {
        stack.pop();
      }

      if (stack.length === 0) {
        // This is a root node
        roots.push(current);
      } else {
        // Add as child of the top of stack
        const parent = stack[stack.length - 1];
        parent.children.push(current);

        // Check for skipped levels
        const parentLevel = this.getLevel(parent.tag);
        if (currentLevel - parentLevel > 1) {
          // Levels were skipped (e.g., h2 -> h4)
          result['skipped-levels'].push([
            this.shallowCopy(parent),
            this.shallowCopy(current)
          ]);
        }
      }

      stack.push(current);
    }

    return roots;
  }

  /**
   * Detects headings that are incongruent with DOM structure.
   */
  private detectIncongruentHeadings(headings: HeadingInfo[], result: AnalysisResult): void {
    for (let i = 0; i < headings.length; i++) {
      const current = headings[i];
      const currentLevel = current.level;
      const currentDepth = current.domDepth;

      let isIncongruent = false;

      // Check all preceding headings
      for (let j = 0; j < i; j++) {
        const preceding = headings[j];
        const precedingLevel = preceding.level;
        const precedingDepth = preceding.domDepth;

        // If preceding heading is semantically weaker (higher number)
        // but appears at a shallower DOM depth, current heading is incongruent
        if (precedingLevel > currentLevel && precedingDepth < currentDepth) {
          isIncongruent = true;
          break;
        }
      }

      if (isIncongruent) {
        result['incongruent-headings'].push(this.shallowCopy(current.node));
      }
    }
  }
}
