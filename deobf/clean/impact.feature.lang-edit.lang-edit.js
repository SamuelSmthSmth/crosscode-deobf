/**
 * impact.feature.lang-edit.lang-edit
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.lang-edit.lang-edit")`.
 *
 * Community translation tool (`ig.langEdit`): collects changed `ig.LangLabel`s
 * (map entries and recent entries) and submits them as edit suggestions to
 * the CrossCode translation API via an in-game overlay mask.
 */
ig.module("impact.feature.lang-edit.lang-edit")
    .requires("impact.base.game")
    .defines(function () {

    ig.LANG_EDIT_API_BASE = "https://www.cross-code.com/page/api/";
    ig.LANG_EDIT_SUBMIT_URL = ig.LANG_EDIT_API_BASE + "lang-edit-submit.php";
    ig.LANG_EDIT_OVERVIEW_URL = ig.LANG_EDIT_API_BASE + "lang-edit-overview.php";
    ig.LANG_EDIT_LIST_URL = ig.LANG_EDIT_API_BASE + "lang-edit-list.php";
    ig.LANG_EDIT_RESOLVE_URL = ig.LANG_EDIT_API_BASE + "lang-edit-resolve.php";
    ig.LANG_SEND_URL = ig.LANG_EDIT_API_BASE + "lang-send.php";
    ig.LANG_GET_URL = ig.LANG_EDIT_API_BASE + "lang-get.php";
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

        init: function () {
            this.parent("LangEdit");
        },

        /** Queue a changed label for the current map (deduped by `what`). */
        submitCustomFile: function (what, content, file, isRecent) {
            if (!content instanceof ig.LangLabel) throw Error("You can only submit langLabels to lang-edit");
            if (!isRecent || !this.isWhatRecent(what)) {
                this.recentEntries.push({
                    what: what,
                    content: content,
                    file: file
                });
                this.recentEntries.length > 200 && this.recentEntries.shift();
            }
        },

        submitMap: function (what, content) {
            if (!content instanceof ig.LangLabel) throw Error("You can only submit langLabels to lang-edit");
            this.mapEntries.push({
                what: what,
                content: content
            });
        },

        submitRecent: function (what, content) {
            if (!content instanceof ig.LangLabel) throw Error("You can only submit langLabels to lang-edit");
            this.recentEntries.push({
                what: what,
                content: content
            });
            this.recentEntries.length > 200 && this.recentEntries.shift();
        },

        isWhatRecent: function (what) {
            for (var i = this.recentEntries.length; i--;)
                if (what == this.recentEntries[i].what) return true;
            return false;
        },

        toggleMask: function () {
            this.maskVisible ? this.closeMask() : this.showMask();
        },

        showMask: function () {
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
                this._updateUserText();
            } else {
                this.panels.user.show();
            }
            this.panels.map.hide();
            this.panels.recent.show();
            this.mask.show();
            this.panels.recent[0].scrollTop = this.panels.recent[0].scrollHeight;
        },

        closeMask: function () {
            this.maskVisible = false;
            ig.system.focusLost = false;
            this.mask.hide();
        },

        /** Build the overlay DOM (user panel, map/recent tabs, footer). */
        _createMask: function () {
            var mask = ig.dom.create("div");
            mask.addClass("langEdit");
            var container = ig.dom.create("div");
            container.addClass("container");
            mask.append(container);
            var header = ig.dom.html('<div class="header"></div>');
            header.append(ig.dom.html("<h2>" + ig.lang.get("sc.gui.lang-edit.title") + "</h2>"));
            var mapTab = ig.dom.html("<button>" + ig.lang.get("sc.gui.lang-edit.map") + "</button>"),
                recentTab = ig.dom.html("<button>" + ig.lang.get("sc.gui.lang-edit.recent") + "</button>"),
                userInfo = ig.dom.html('<div class="userInfo" >' + ig.lang.get("sc.gui.lang-edit.user-prefix") +
                    ' <span class="name" ></span> (<span class="email"></span>) <a>' + ig.lang.get("sc.gui.lang-edit.user-edit") + "</a></div>");
            header.append(mapTab);
            header.append(recentTab);
            header.append(userInfo);
            var form = this.form = ig.dom.create("form"),
                userPanel = this.panels.user = ig.dom.html('<div class="user"></div>');
            this.panels.user.append(ig.dom.html("<h2>" + ig.lang.get("sc.gui.lang-edit.user-credentials") + "</h2>"));
            this.userName = ig.dom.html('<input type="text" name="userName" placeholder="' + ig.lang.get("sc.gui.lang-edit.user-name") + '"/>');
            this.userEmail = ig.dom.html('<input type="text" name="userEmail" placeholder="' + ig.lang.get("sc.gui.lang-edit.user-email") + '"/>');
            this.panels.user.append(this.userName);
            this.panels.user.append(this.userEmail);
            var userSubmit = ig.dom.html('<button type="button">' + ig.lang.get("sc.gui.lang-edit.submit") + "</button>");
            userPanel.append(userSubmit);
            ig.dom.bind(userSubmit, "click", this._onUserSubmit.bind(this));
            var mapPanel = this.panels.map = ig.dom.html('<div class="map"></div>'),
                recentPanel = this.panels.recent = ig.dom.html('<div class="recent"></div>');
            form.append(mapPanel);
            form.append(recentPanel);
            form.append(userPanel);
            var footer = ig.dom.html('<div class="footer" ></div>'),
                sendButton = ig.dom.html('<button type="submit">' + ig.lang.get("sc.gui.lang-edit.send-report") + "</button>"),
                cancelButton = ig.dom.html('<button type="button">' + ig.lang.get("sc.gui.lang-edit.cancel") + "</button>");
            footer.append(sendButton);
            footer.append(cancelButton);
            ig.dom.bind(mapTab, "click", function () {
                mapPanel.show();
                recentPanel.hide();
            });
            ig.dom.bind(recentTab, "click", function () {
                recentPanel.show();
                mapPanel.hide();
            });
            ig.dom.bind(userInfo.find("a"), "click", function () {
                userPanel.show();
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
            ig.dom.bind(this.errorLabel, "click", function () {
                this.errorLabel.hide();
            }.bind(this));
            container.append(header);
            container.append(footer);
            container.append(form);
            container.append(this.saveLabel);
            container.append(this.errorLabel);
            // Click on an "original" textarea toggles editing of that entry.
            ig.dom.bind(container, "click", function (event) {
                event = event.target;
                if (event.className == "original") {
                    var li = $(event.parentNode),
                        modification = li.find(".modification"),
                        comment = li.find(".comment");
                    if (li.hasClass("edit")) {
                        !comment.val() && modification.val() == event.value && li.removeClass("edit");
                    } else {
                        li.addClass("edit");
                        modification.select();
                    }
                }
            });
            ig.dom.bind(cancelButton, "click", this.closeMask.bind(this));
            ig.dom.bind(sendButton, "click", this._submit.bind(this));
            this.mask = mask;
            this.mask.hide();
            document.body.appendChild(this.mask[0]);
        },

        /** Build the <ul> of entries (hidden ids/files + editable textareas). */
        _createEntryList: function (entries) {
            for (var list = ig.dom.create("ul"), i = 0; i < entries.length; ++i) {
                var entry = entries[i],
                    li = ig.dom.create("li"),
                    label = ig.dom.create("label");
                label.text(entry.what && entry.what.toString());
                var idInput = ig.dom.html('<input type="hidden" readonly name="id[]" class="id">'),
                    langUid = Math.abs(entry.content.langUid);
                idInput.val(langUid);
                var file = entry.file;
                if (!file) file = entry.content.originFile;
                var fileInput = ig.dom.html('<input type="hidden" readonly name="file[]" class="file">');
                fileInput.val(file);
                var original = ig.dom.html('<textarea readonly name="original[]" class="original"></textarea>');
                original.val(entry.content.toString());
                var modification = ig.dom.html('<textarea name="modification[]" class="modification"></textarea>');
                modification.val(entry.content.toString());
                var comment = ig.dom.html('<textarea name="comment[]" class="comment" placeholder="' + ig.lang.get("sc.gui.lang-edit.comment") + '"></textarea>');
                li.append(idInput);
                li.append(fileInput);
                li.append(label);
                li.append(original);
                li.append(modification);
                li.append(comment);
                list.append(li);
            }
            return list;
        },

        /** Revert all in-progress edits back to the original text. */
        _resetEntryList: function (panel) {
            panel.find("li.edit").each(function () {
                var li = $(this);
                li.find(".modification").val(li.find(".original").val());
                li.find(".comment").val("");
                li.removeClass("edit");
            });
        },

        _onUserSubmit: function () {
            localStorage.setItem("ccLangEditUser", this.userName.val());
            localStorage.setItem("ccLangEditEmail", this.userEmail.val());
            this.panels.user.hide();
            this._updateUserText();
        },

        _updateUserText: function () {
            this.mask.find(".userInfo .name").text(this.userName.val());
            this.mask.find(".userInfo .email").text(this.userEmail.val());
        },

        /** Collect the edited entries and POST them to the submit API. */
        _submit: function () {
            var data = {
                userName: this.userName.val(),
                userEmail: this.userEmail.val(),
                map: ig.game.mapName.toPath("data/maps/", ".json"),
                lang: ig.currentLang,
                changes: []
            };
            this.mask.find("li.edit").each(function () {
                var li = $(this),
                    id = li.find(".id").val(),
                    original = li.find(".original").val(),
                    modification = li.find(".modification").val(),
                    comment = li.find(".comment").val(),
                    file = li.find(".file").val() || null;
                (original != modification || comment) && data.changes.push({
                    id: id,
                    original: original,
                    modification: modification,
                    comment: comment,
                    file: file
                });
            });
            if (data.changes.length > 0) {
                var payload = JSON.stringify(data),
                    payload = "data=" + encodeURIComponent(payload);
                this.saveLabel.show();
                $.ajax({
                    url: ig.LANG_EDIT_SUBMIT_URL,
                    type: "POST",
                    dataType: "json",
                    async: true,
                    data: payload,
                    success: this._saveResponse.bind(this),
                    error: this._saveResponse.bind(this)
                });
            } else {
                this.closeMask();
            }
        },

        _saveResponse: function (response) {
            this.saveLabel.hide();
            console.log(response);
            if (response.success !== true) {
                response.responseText ? this.errorLabel.find("div").text(response.responseText) :
                    this.errorLabel.find("div").text("No response?");
                this.errorLabel.show();
            } else {
                this.closeMask();
            }
        },

        levelLoadStartOrder: -100,

        onLevelLoadStart: function () {
            this.mapEntries.length = 0;
            this.recentEntries.length = 0;
            this.mapEntryList = null;
        }
    });

    ig.addGameAddon(function () {
        return ig.langEdit = new ig.LangEdit();
    });
});
ig.baked = !0;
