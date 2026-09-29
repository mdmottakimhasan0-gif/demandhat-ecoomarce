import React from "react";

function Category() {
    return (
        <>
            <div className="flex-col bg-white shadow-sm p-5">
                <h1 className="text-2xl py-2">Categories</h1>
                <div className="relative px-4">
                    <Link
                        href="/admin/addCategory"
                        className="absolute right-2 px-3 py-2 rouded-lg bg-blue-500 text-white"
                    >
                        Add Category
                    </Link>
                </div>

                <div className="border-sm rounded-lg"></div>
            </div>
        </>
    );
}

export default Category;
