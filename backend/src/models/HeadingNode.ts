export interface HeadingNode {
  tag: string;
  content: string;
  children: HeadingNode[];
}

export interface AnalysisResult {
  'semantic-structure': HeadingNode[];
  'skipped-levels': [HeadingNode, HeadingNode][];
  'incongruent-headings': HeadingNode[];
}

export interface HeadingInfo {
  node: HeadingNode;
  domDepth: number;
  level: number;
}
