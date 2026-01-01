import React, { useState } from 'react';
import { FilePair, MatchFragment } from './types';
import { PairCodeEditor } from './PairCodeEditor';
import { SimilarityBadge } from './SimilarityBadge';
import { FragmentsTable } from './FragmentsTable';

interface PairComparisonProps {
    /** The file pair to compare */
    pair: FilePair;
    /** Programming language for syntax highlighting */
    language?: string;
    /** Height of each code editor */
    editorHeight?: string | number;
    /** Show fragments table below editors */
    showFragmentsTable?: boolean;
}

/**
 * Side-by-side code comparison view with highlighted matching fragments.
 * 
 * This is the main component for displaying plagiarism detection results.
 * It shows two code editors side by side with synchronized selection and
 * highlighting of matching code regions.
 * 
 * This is a React port of Dolos's CompareCard.vue component.
 */
export const PairComparison: React.FC<PairComparisonProps> = ({
    pair,
    language = 'java',
    editorHeight = 500,
    showFragmentsTable = true,
}) => {
    const [selectedFragment, setSelectedFragment] = useState<MatchFragment | null>(null);
    const [hoveredFragment, setHoveredFragment] = useState<MatchFragment | null>(null);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            {/* Header with similarity info */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                        {pair.leftFile.filename} vs {pair.rightFile.filename}
                    </h2>
                    <div style={{ marginTop: '4px', color: '#666', fontSize: '14px' }}>
                        {pair.fragments.length} matching fragments • Longest: {pair.longest} k-grams
                    </div>
                </div>
                <SimilarityBadge similarity={pair.similarity} size="large" />
            </div>

            {/* Side-by-side editors */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
            }}>
                {/* Left editor */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                }}>
                    <PairCodeEditor
                        side="left"
                        file={pair.leftFile}
                        fragments={pair.fragments}
                        selectedFragment={selectedFragment}
                        hoveredFragment={hoveredFragment}
                        onFragmentSelect={setSelectedFragment}
                        onFragmentHover={setHoveredFragment}
                        language={language}
                        height={editorHeight}
                    />
                </div>

                {/* Right editor */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                }}>
                    <PairCodeEditor
                        side="right"
                        file={pair.rightFile}
                        fragments={pair.fragments}
                        selectedFragment={selectedFragment}
                        hoveredFragment={hoveredFragment}
                        onFragmentSelect={setSelectedFragment}
                        onFragmentHover={setHoveredFragment}
                        language={language}
                        height={editorHeight}
                    />
                </div>
            </div>

            {/* Fragments table */}
            {showFragmentsTable && pair.fragments.length > 0 && (
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e0e0e0',
                        fontWeight: 600,
                    }}>
                        Matching Fragments
                    </div>
                    <FragmentsTable
                        fragments={pair.fragments}
                        selectedFragment={selectedFragment}
                        onFragmentSelect={setSelectedFragment}
                    />
                </div>
            )}

            {/* Keyboard shortcuts hint */}
            <div style={{
                padding: '8px 12px',
                backgroundColor: '#f9f9f9',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#666',
            }}>
                <strong>Tip:</strong> Click on highlighted code to select a fragment.
                Both editors will scroll to show the matching region.
            </div>
        </div>
    );
};

export default PairComparison;
