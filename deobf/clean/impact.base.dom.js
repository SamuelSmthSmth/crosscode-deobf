/**
 * impact.base.dom
 * ================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.dom")`.
 *
 * DOM helpers. Everything returns/accepts jQuery-style `$`-wrapped collections
 * (the game includes jQuery). Also uses a shared DOMParser for building DOM from
 * HTML strings.
 */
ig.module("impact.base.dom").defines(function () {

    var parser = new DOMParser();

    ig.dom = {
        /**
         * Create an element with attributes and children; returns a $-wrapped node.
         * @param {string} tagName
         * @param {Object} [attributes] attribute name -> value
         * @param {*} [content] array of nodes, jQuery object, or text
         */
        create: function (tagName, attributes, content) {
            var el = document.createElement(tagName);
            if (attributes) {
                for (var key in attributes) el.setAttribute(key, attributes[key]);
            }
            if (content || content === 0) {
                if (content instanceof Array) {
                    for (var i = 0; i < content.length; ++i) el.appendChild(content[i][0]);
                } else if (content instanceof jQuery) {
                    el.appendChild(content[0]);
                } else {
                    el.textContent = content.toString();
                }
            }
            return $(el);
        },

        /** Parse an HTML string into a $-wrapped node. */
        html: function (html) {
            var doc = parser.parseFromString(html, "text/html");
            return !doc ? $(html) : $(doc.body.firstChild);
        },

        append: function (parent, child) {
            parent[0].appendChild(child[0]);
        },

        prepend: function (parent, child) {
            parent[0].insertBefore(child[0], parent[0].firstChild);
        },

        before: function (ref, node) {
            ref[0].parentElement.insertBefore(node[0], ref[0]);
        },

        bind: function (el, event, handler) {
            if (el && el.length) return el[0].addEventListener(event, handler);
        },
    };

    // Stable named re-exports (anti-mangling glue the build emits).
    ig.dom = ig.dom;
    ig.dom.create = ig.dom.create;
    ig.dom.html = ig.dom.html;
    ig.dom.append = ig.dom.append;
    ig.dom.prepend = ig.dom.prepend;
    ig.dom.before = ig.dom.before;
    ig.dom.bind = ig.dom.bind;
});
