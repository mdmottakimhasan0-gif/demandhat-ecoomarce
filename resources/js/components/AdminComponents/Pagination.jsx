import React from "react";
import { Link } from "@inertiajs/react";

export default function Pagination({ links, total }) {
    // If there is only one page, Laravel still returns 3 links (Prev, 1, Next)
    // We hide pagination if there are no links or only one page of results.
    if (!links || links.length <= 3) {
        return (
            <div className="bg-white dark:bg-slate-950 px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between rounded-b-lg shadow-sm">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Orders: <span className="font-semibold">{total}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-950 px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between rounded-b-lg shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Orders:{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                    {total}
                </span>
            </div>

            <div className="flex flex-wrap gap-1 justify-end">
                {links.map((link, index) =>
                    link.url === null ? (
                        // If no URL (disabled button like "Previous" on page 1)
                        <span
                            key={index}
                            className="md:px-3 px-2 py-1 md:py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-default bg-gray-50 dark:bg-slate-900/50"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        // If there is a URL (clickable page button)
                        <Link
                            key={index}
                            href={link.url}
                            // Important: preserves scroll position so the user stays at the table level
                            preserveScroll
                            className={`md:px-3 px-2 py-1 md:py-1.5 text-sm rounded-md border transition-colors 
                                ${
                                    link.active
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                                }
                            `}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </div>
        </div>
    );
}
