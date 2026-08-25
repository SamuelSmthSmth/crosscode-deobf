ig.module("impact.feature.lang-edit.lang-edit").requires("impact.base.game").defines(function() {
    ig.LANG_EDIT_API_BASE = "https://www.cross-code.com/page/api/";
    ig.LANG_EDIT_SUBMIT_URL = ig.LANG_EDIT_API_BASE + "lang-edit-submit.php";
    ig.LANG_EDIT_OVERVIEW_URL = ig.LANG_EDIT_API_BASE + "lang-edit-overview.php";
    ig.LANG_EDIT_LIST_URL = ig.LANG_EDIT_API_BASE + "lang-edit-list.php";
    ig.LANG_EDIT_RESOLVE_URL = ig.LANG_EDIT_API_BASE + "lang-edit-resolve.php";
    ig.LANG_SEND_URL = ig.LANG_EDIT_API_BASE + "lang-send.php";
    ig.LANG_GET_URL =
        ig.LANG_EDIT_API_BASE + "lang-get.php";
    ig.LANG_BATCHES_GET_URL = ig.LANG_EDIT_API_BASE + "lang-batches.php";
    ig.LangEdit = ig.GameAddon.extend({
        mapEntries: [],
        recentEntries: [],
        maskVisible: false,
        mask: null,
        form: null,
        panels: {
            user: null,
            map: null,
            recent: null
        },
        userName: null,
        userpassword: null,
        mapEntryList: null,
        saveLabel: null,
        errorLabel: null,
        init: function() {
            this.parent("LangEdit")
        },
        submitCustomFile: function(b, a, d, c) {
            if (!a instanceof ig.LangLabel) throw Error("You can only submit langLabels to lang-edit");
            if (!c || !this.isWhatRecent(b)) {
                this.recentEntries.push({
                    what: b,
                    content: a,
                    file: d
                });
                this.recentEntries.length > 200 && this.recentEntries.shift()
            }
        },
        submitMap: function(b, a) {
            if (!a instanceof ig.LangLabel) throw Error("You can only submit langLabels to lang-edit");
            this.mapEntries.push({
                what: b,
                content: a
            })
        },
        submitRecent: function(b, a) {
            if (!a instanceof ig.LangLabel) throw Error("You can only submit langLabels to lang-edit");
            this.recentEntries.push({
                what: b,
                content: a
            });
            this.recentEntries.length > 200 && this.recentEntries.shift()
        },
        isWhatRecent: function(b) {
            for (var a = this.recentEntries.length; a--;)
                if (b ==
                    this.recentEntries[a].what) return true;
            return false
        },
        toggleMask: function() {
            this.maskVisible ? this.closeMask() : this.showMask()
        },
        showMask: function() {
            this.maskVisible = true;
            ig.system.setFocusLost();
            this.mask || this._createMask();
            if (!this.mapEntryList) this.mapEntryList = this._createEntryList(this.mapEntries);
            this.mask.find(".map").empty().append(this.mapEntryList);
            this.mask.find(".recent").empty().append(this._createEntryList(this.recentEntries));
            this._resetEntryList(this.panels.map);
            if (localStorage.getItem("ccLangEditUser")) {
                this.panels.user.hide();
                this.userName.val(localStorage.getItem("ccLangEditUser"));
                this.userEmail.val(localStorage.getItem("ccLangEditEmail"));
                this._updateUserText()
            } else this.panels.user.show();
            this.panels.map.hide();
            this.panels.recent.show();
            this.mask.show();
            this.panels.recent[0].scrollTop = this.panels.recent[0].scrollHeight
        },
        closeMask: function() {
            this.maskVisible = false;
            ig.system.focusLost = false;
            this.mask.hide()
        },
        _createMask: function() {
            var b = ig.dom.create("div");
            b.addClass("langEdit");
            var a = ig.dom.create("div");
            a.addClass("container");
            b.append(a);
            var d = ig.dom.html('<div class="header"></div>');
            d.append(ig.dom.html("<h2>" + ig.lang.get("sc.gui.lang-edit.title") + "</h2>"));
            var c = ig.dom.html("<button>" + ig.lang.get("sc.gui.lang-edit.map") + "</button>"),
                e = ig.dom.html("<button>" + ig.lang.get("sc.gui.lang-edit.recent") + "</button>"),
                f = ig.dom.html('<div class="userInfo" >' + ig.lang.get("sc.gui.lang-edit.user-prefix") + ' <span class="name" ></span> (<span class="email"></span>) <a>' + ig.lang.get("sc.gui.lang-edit.user-edit") + "</a></div>");
            d.append(c);
            d.append(e);
            d.append(f);
            var g = this.form = ig.dom.create("form"),
                h = this.panels.user = ig.dom.html('<div class="user"></div>');
            this.panels.user.append(ig.dom.html("<h2>" + ig.lang.get("sc.gui.lang-edit.user-credentials") + "</h2>"));
            this.userName = ig.dom.html('<input type="text" name="userName" placeholder="' + ig.lang.get("sc.gui.lang-edit.user-name") + '"/>');
            this.userEmail = ig.dom.html('<input type="text" name="userEmail" placeholder="' + ig.lang.get("sc.gui.lang-edit.user-email") + '"/>');
            this.panels.user.append(this.userName);
            this.panels.user.append(this.userEmail);
            var i = ig.dom.html('<button type="button">' + ig.lang.get("sc.gui.lang-edit.submit") + "</button>");
            h.append(i);
            ig.dom.bind(i, "click", this._onUserSubmit.bind(this));
            var j = this.panels.map = ig.dom.html('<div class="map"></div>'),
                k = this.panels.recent = ig.dom.html('<div class="recent"></div>');
            g.append(j);
            g.append(k);
            g.append(h);
            var i = ig.dom.html('<div class="footer" ></div>'),
                l = ig.dom.html('<button type="submit">' + ig.lang.get("sc.gui.lang-edit.send-report") + "</button>"),
                o = ig.dom.html('<button type="button">' + ig.lang.get("sc.gui.lang-edit.cancel") + "</button>");
            i.append(l);
            i.append(o);
            ig.dom.bind(c, "click", function() {
                j.show();
                k.hide()
            });
            ig.dom.bind(e, "click", function() {
                k.show();
                j.hide()
            });
            ig.dom.bind(f.find("a"), "click", function() {
                h.show()
            });
            this.saveLabel = ig.dom.html('<div class="saving" >' + ig.lang.get("sc.gui.lang-edit.sending") + "</div>");
            this.saveLabel.css({
                display: "none"
            });
            this.errorLabel = ig.dom.html('<div class="error" ><h2>' + ig.lang.get("sc.gui.lang-edit.error") +
                "</h2><div></div></div>");
            this.errorLabel.css({
                display: "none"
            });
            ig.dom.bind(this.errorLabel, "click", function() {
                this.errorLabel.hide()
            }.bind(this));
            a.append(d);
            a.append(i);
            a.append(g);
            a.append(this.saveLabel);
            a.append(this.errorLabel);
            ig.dom.bind(a, "click", function(a) {
                a = a.target;
                if (a.className == "original") {
                    var b = $(a.parentNode),
                        c = b.find(".modification"),
                        d = b.find(".comment");
                    if (b.hasClass("edit")) !d.val() && c.val() == a.value && b.removeClass("edit");
                    else {
                        b.addClass("edit");
                        c.select()
                    }
                }
            });
            ig.dom.bind(o,
                "click", this.closeMask.bind(this));
            ig.dom.bind(l, "click", this._submit.bind(this));
            this.mask = b;
            this.mask.hide();
            document.body.appendChild(this.mask[0])
        },
        _createEntryList: function(b) {
            for (var a = ig.dom.create("ul"), d = 0; d < b.length; ++d) {
                var c = b[d],
                    e = ig.dom.create("li"),
                    f = ig.dom.create("label");
                f.text(c.what && c.what.toString());
                var g = ig.dom.html('<input type="hidden" readonly name="id[]" class="id">'),
                    h = Math.abs(c.content.langUid);
                g.val(h);
                var i = c.file;
                if (!i) i = c.content.originFile;
                h = ig.dom.html('<input type="hidden" readonly name="file[]" class="file">');
                h.val(i);
                i = ig.dom.html('<textarea readonly name="original[]" class="original"></textarea>');
                i.val(c.content.toString());
                var j = ig.dom.html('<textarea name="modification[]" class="modification"></textarea>');
                j.val(c.content.toString());
                c = ig.dom.html('<textarea name="comment[]" class="comment" placeholder="' + ig.lang.get("sc.gui.lang-edit.comment") + '"></textarea>');
                e.append(g);
                e.append(h);
                e.append(f);
                e.append(i);
                e.append(j);
                e.append(c);
                a.append(e)
            }
            return a
        },
        _resetEntryList: function(b) {
            b.find("li.edit").each(function() {
                var a =
                    $(this);
                a.find(".modification").val(a.find(".original").val());
                a.find(".comment").val("");
                a.removeClass("edit")
            })
        },
        _onUserSubmit: function() {
            localStorage.setItem("ccLangEditUser", this.userName.val());
            localStorage.setItem("ccLangEditEmail", this.userEmail.val());
            this.panels.user.hide();
            this._updateUserText()
        },
        _updateUserText: function() {
            this.mask.find(".userInfo .name").text(this.userName.val());
            this.mask.find(".userInfo .email").text(this.userEmail.val())
        },
        _submit: function() {
            var b = {
                userName: this.userName.val(),
                userEmail: this.userEmail.val(),
                map: ig.game.mapName.toPath("data/maps/", ".json"),
                lang: ig.currentLang,
                changes: []
            };
            this.mask.find("li.edit").each(function() {
                var a = $(this),
                    c = a.find(".id").val(),
                    e = a.find(".original").val(),
                    f = a.find(".modification").val(),
                    g = a.find(".comment").val(),
                    a = a.find(".file").val() || null;
                (e != f || g) && b.changes.push({
                    id: c,
                    original: e,
                    modification: f,
                    comment: g,
                    file: a
                })
            });
            if (b.changes.length > 0) {
                var a = JSON.stringify(b),
                    a = "data=" + encodeURIComponent(a);
                this.saveLabel.show();
                $.ajax({
                    url: ig.LANG_EDIT_SUBMIT_URL,
                    type: "POST",
                    dataType: "json",
                    async: true,
                    data: a,
                    success: this._saveResponse.bind(this),
                    error: this._saveResponse.bind(this)
                })
            } else this.closeMask()
        },
        _saveResponse: function(b) {
            this.saveLabel.hide();
            console.log(b);
            if (b.success !== true) {
                b.responseText ? this.errorLabel.find("div").text(b.responseText) : this.errorLabel.find("div").text("No response?");
                this.errorLabel.show()
            } else this.closeMask()
        },
        levelLoadStartOrder: -100,
        onLevelLoadStart: function() {
            this.mapEntries.length = 0;
            this.recentEntries.length = 0;
            this.mapEntryList =
                null
        }
    });
    ig.addGameAddon(function() {
        return ig.langEdit = new ig.LangEdit
    })
});
ig.baked = !0;
