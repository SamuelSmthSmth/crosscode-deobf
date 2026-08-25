ig.module("impact.base.dom").defines(function() {
    var b = new DOMParser;
    ig.dom = {
        create: function(a, b, c) {
            a = document.createElement(a);
            if (b)
                for (var e in b) a.setAttribute(e, b[e]);
            if (c || c === 0)
                if (c instanceof Array)
                    for (b = 0; b < c.length; ++b) a.appendChild(c[b][0]);
                else c instanceof jQuery ? a.appendChild(c[0]) : a.textContent = c.toString();
            return $(a)
        },
        html: function(a) {
            var d = b.parseFromString(a, "text/html");
            return !d ? $(a) : $(d.body.firstChild)
        },
        append: function(a, b) {
            a[0].appendChild(b[0])
        },
        prepend: function(a, b) {
            a[0].insertBefore(b[0],
                a[0].firstChild)
        },
        before: function(a, b) {
            a[0].parentElement.insertBefore(b[0], a[0])
        },
        bind: function(a, b, c) {
            if (a && a.length) return a[0].addEventListener(b, c)
        }
    };
    ig.dom = ig.dom;
    ig.dom.create = ig.dom.create;
    ig.dom.html = ig.dom.html;
    ig.dom.append = ig.dom.append;
    ig.dom.prepend = ig.dom.prepend;
    ig.dom.before = ig.dom.before;
    ig.dom.bind = ig.dom.bind
});
ig.baked = !0;
