import React, { useEffect } from "react";
import { Head } from "@inertiajs/react";
import CustomerLayout from "../../Layouts/CustomerLayouts/CustomerLayout";

/**
 * "Default website header & footer" mode: the server-rendered landing markup is placed inside the
 * regular customer layout. The same lightweight tracker used by blank landing pages is loaded, and
 * custom scripts are injected as real (executing) elements.
 */
function inject(html, where) {
    if (!html || !html.trim()) return () => {};
    const frag = document.createRange().createContextualFragment(html);
    const nodes = Array.from(frag.childNodes);
    (where === "head" ? document.head : document.body).appendChild(frag);
    return () => nodes.forEach((n) => n.parentNode && n.parentNode.removeChild(n));
}

export default function LandingPageView({ seo, css, fontsUrl, body, scripts, runtime }) {
    useEffect(() => {
        window.__LP = runtime;
        const script = document.createElement("script");
        script.src = "/vendor/landing/tracker.js?v=1";
        script.defer = true;
        document.body.appendChild(script);

        const undo = [inject(scripts.head, "head"), inject(scripts.body_start, "body"), inject(scripts.body_end, "body")];

        const root = document.getElementById("lp-root");
        if (root) {
            root.querySelectorAll("script").forEach((oldScript) => {
                try {
                    const newScript = document.createElement("script");
                    Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
                    newScript.textContent = oldScript.textContent;
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                } catch (e) {
                    console.warn("Script execution error:", e);
                }
            });
        }

        return () => {
            script.remove();
            undo.forEach((u) => u());
        };
    }, []);

    return (
        <CustomerLayout>
            <Head>
                <title>{seo.title}</title>
                {seo.canonical && <link rel="canonical" href={seo.canonical} />}
                {seo.meta.map((m) => (m.attr === "name" ? <meta key={m.key} name={m.key} content={m.content} /> : <meta key={m.key} property={m.key} content={m.content} />))}
                {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}
            </Head>
            <style dangerouslySetInnerHTML={{ __html: css }} />
            <div className="lp-body lp-root" id="lp-root" dangerouslySetInnerHTML={{ __html: body }} />
        </CustomerLayout>
    );
}
