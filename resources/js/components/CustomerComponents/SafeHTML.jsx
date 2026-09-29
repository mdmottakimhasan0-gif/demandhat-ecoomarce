import React from "react";

const SafeHTML = ({ html, className = "" }) => {
    if (!html) return null;

    return (
        <div
            className={`prose prose-sm sm:prose-base max-w-none font-hindSiliguri ${className}`}
        >
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .prose mark {
                    background-color: #ffc0cb; 
                    color: inherit;
                    padding: 0 2px;
                    border-radius: 2px;
                }
                /* Ensure strong tags are explicitly bold even with custom reset constraints */
                .prose strong, .prose b {
                    font-weight: 700 !important;
                }
                /* Tighten default paragraph line height and vertical margins */
                .prose p {
                    margin-top: 0.25rem !important;
                    margin-bottom: 0.25rem !important;
                    line-height: 1.5 !important;
                }
                /* Fallback bullet and decimal styling for list items if preflight overrides them */
                .prose ul {
                    list-style-type: disc !important;
                    padding-left: 1.5rem !important;
                    margin-top: 0.5rem !important;
                    margin-bottom: 0.5rem !important;
                }
                .prose ol {
                    list-style-type: decimal !important;
                    padding-left: 1.5rem !important;
                    margin-top: 0.5rem !important;
                    margin-bottom: 0.5rem !important;
                }
                .prose li {
                    margin-top: 0.125rem !important;
                    margin-bottom: 0.125rem !important;
                }
                /* CRITICAL: Eliminate block spacing and margins of nested paragraphs inside list items */
                .prose li p {
                    margin-top: 0 !important;
                    margin-bottom: 0 !important;
                    display: inline !important;
                }
            `,
                }}
            />
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
};

export default SafeHTML;
