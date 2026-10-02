var channels = [];
var currentChannels = [];
var currentCategory = "All Channels";
var isChannelPlaying = false;
var isChannelPaused = false;


document.addEventListener("DOMContentLoaded", function () {

    console.log("StreamNest started");

   startClock();

setupWelcomeScreen();

setupTVRemote();

    var savedPlaylist =
        localStorage.getItem("streamnest_playlist");

    if (savedPlaylist) {

        document.getElementById("playlist-url").value =
            savedPlaylist;
    }

});


function startClock() {

    updateClock();

    setInterval(updateClock, 1000);
}


function updateClock() {

    var now = new Date();

    var hours =
        String(now.getHours()).padStart(2, "0");

    var minutes =
        String(now.getMinutes()).padStart(2, "0");

    var clock =
        document.getElementById("clock");

    if (clock) {
        clock.textContent =
            hours + ":" + minutes;
    }
}


function setupWelcomeScreen() {

    var button =
        document.getElementById("add-playlist-btn");

    var input =
        document.getElementById("playlist-url");


    button.addEventListener("click", function () {

        loadPlaylist();

    });


    input.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            loadPlaylist();
        }

    });


    input.focus();
}


function loadPlaylist() {

    var input =
        document.getElementById("playlist-url");

    var status =
        document.getElementById("status-message");

    var url =
        input.value.trim();


    if (!url) {

        showStatus(
            "Please enter a playlist URL.",
            "error"
        );

        return;
    }


    if (
        url.indexOf("http://") !== 0 &&
        url.indexOf("https://") !== 0
    ) {

        showStatus(
            "Please enter a valid HTTP or HTTPS URL.",
            "error"
        );

        return;
    }


    showStatus(
        "Loading playlist...",
        ""
    );


    fetch(url)
        .then(function (response) {

            if (!response.ok) {

                throw new Error(
                    "Server returned " + response.status
                );
            }

            return response.text();

        })
        .then(function (text) {

            var parsed =
                parseM3U(text);


            if (parsed.length === 0) {

                throw new Error(
                    "No channels were found in this playlist."
                );
            }


            channels = parsed;

            localStorage.setItem(
                "streamnest_playlist",
                url
            );


            showStatus(
                channels.length +
                " channels loaded.",
                "success"
            );


            setTimeout(function () {

                openTVScreen();

            }, 500);

        })
        .catch(function (error) {

            console.error(error);

            showStatus(
                "Could not load playlist: " +
                error.message,
                "error"
            );

        });

}


function parseM3U(text) {

    var result = [];

    var lines =
        text.replace(/\r/g, "")
            .split("\n");

    var info = null;


    for (var i = 0; i < lines.length; i++) {

        var line =
            lines[i].trim();


        if (
            line.indexOf("#EXTINF:") === 0
        ) {

            info =
                parseExtInf(line);

        }

        else if (
            line &&
            line.charAt(0) !== "#" &&
            info
        ) {

            info.url = line;

            result.push(info);

            info = null;
        }
    }


    return result;
}


function parseExtInf(line) {

    var name = "Unknown Channel";
    var group = "Other";
    var logo = "";


    var comma =
        line.lastIndexOf(",");


    if (comma !== -1) {

        name =
            line.substring(comma + 1).trim()
            || "Unknown Channel";
    }


    var groupMatch =
        line.match(/group-title="([^"]*)"/i);

    if (groupMatch && groupMatch[1]) {

        group =
            groupMatch[1].trim() || "Other";
    }


    var logoMatch =
        line.match(/tvg-logo="([^"]*)"/i);

    if (logoMatch && logoMatch[1]) {

        logo =
            logoMatch[1].trim();
    }


    return {
        name: name,
        group: group,
        logo: logo,
        url: ""
    };
}


function openTVScreen() {

    document
        .getElementById("welcome-screen")
        .classList.add("hidden");


    document
        .getElementById("tv-screen")
        .classList.remove("hidden");


    document.getElementById(
        "channel-total"
    ).textContent =
        channels.length + " channels";


    buildCategories();

    showCategory("All Channels");
}


function buildCategories() {

    var categoryList =
        document.getElementById(
            "category-list"
        );


    categoryList.innerHTML = "";


    var categories = [
        "All Channels"
    ];


    channels.forEach(function (channel) {

        if (
            categories.indexOf(
                channel.group
            ) === -1
        ) {

            categories.push(
                channel.group
            );
        }

    });


    categories.forEach(
        function (category, index) {

            var item =
                document.createElement("div");

            item.className =
                "category-item";

            item.tabIndex = 0;

            item.textContent =
                category;


            item.addEventListener(
                "click",
                function () {

                    showCategory(category);

                }
            );


            item.addEventListener(
                "keydown",
                function (event) {

                    if (event.key === "Enter") {

                        showCategory(category);
                    }

                }
            );


            categoryList.appendChild(item);


            if (index === 0) {

                item.classList.add(
                    "active"
                );
            }

        }
    );
}


function showCategory(category) {

    currentCategory =
        category;


    if (category === "All Channels") {

        currentChannels =
            channels.slice();

    } else {

        currentChannels =
            channels.filter(
                function (channel) {

                    return (
                        channel.group === category
                    );

                }
            );
    }


    document.getElementById(
        "current-category"
    ).textContent =
        category;


    document.getElementById(
        "current-count"
    ).textContent =
        currentChannels.length +
        " channels";


    var categories =
        document.querySelectorAll(
            ".category-item"
        );


    for (
        var i = 0;
        i < categories.length;
        i++
    ) {

        categories[i]
            .classList.remove("active");


        if (
            categories[i].textContent ===
            category
        ) {

            categories[i]
                .classList.add("active");
        }
    }


    renderChannels();
}


function renderChannels() {

    var list =
        document.getElementById(
            "channel-list"
        );


    list.innerHTML = "";


    currentChannels.forEach(
        function (channel, index) {

            var card =
                document.createElement("div");

            card.className =
                "channel-card";

            card.tabIndex = 0;


            var number =
                document.createElement("div");

            number.className =
                "channel-number";

            number.textContent =
                index + 1;


            card.appendChild(number);


            if (channel.logo) {

                var image =
                    document.createElement("img");

                image.className =
                    "channel-logo";

                image.src =
                    channel.logo;

                image.onerror =
                    function () {

                        this.style.display =
                            "none";
                    };


                card.appendChild(image);

            } else {

                var placeholder =
                    document.createElement("div");

                placeholder.className =
                    "channel-logo-placeholder";

                placeholder.textContent =
                    "TV";


                card.appendChild(
                    placeholder
                );
            }


            var info =
                document.createElement("div");

            info.className =
                "channel-info";


            var title =
                document.createElement("h3");

            title.textContent =
                channel.name;


            var category =
                document.createElement("p");

            category.textContent =
                channel.group;


            info.appendChild(title);

            info.appendChild(category);

            card.appendChild(info);


            card.addEventListener(
                "click",
                function () {

                    selectChannel(channel);

                }
            );


            card.addEventListener(
                "keydown",
                function (event) {

                    if (event.key === "Enter") {

                        selectChannel(channel);
                    }

                }
            );


            list.appendChild(card);

        }
    );


    function setupTVRemote() {

    /*
     * Register Samsung media keys.
     * Arrow keys, Enter and Back do not
     * need to be registered.
     */

    if (
        typeof tizen !== "undefined" &&
        tizen.tvinputdevice
    ) {

        try {

            tizen.tvinputdevice.registerKey(
                "MediaPlayPause"
            );

            console.log(
                "Samsung media keys registered"
            );

        } catch (error) {

            console.log(
                "Could not register media keys:",
                error
            );
        }
    }


    document.addEventListener(
        "keydown",
        function (event) {

            /*
             * BACK
             * Samsung TV keyCode = 10009
             */

            if (event.keyCode === 10009) {

                event.preventDefault();

                handleBackButton();

                return;
            }


            /*
             * PLAY / PAUSE
             */

            if (
                event.key === "MediaPlayPause" ||
                event.keyCode === 10252
            ) {

                event.preventDefault();

                togglePlayPause();

                return;
            }

        }
    );
}


function togglePlayPause() {

    if (
        typeof webapis === "undefined" ||
        !webapis.avplay ||
        !isChannelPlaying
    ) {

        return;
    }


    try {

        var state =
            webapis.avplay.getState();


        if (state === "PLAYING") {

            webapis.avplay.pause();

            isChannelPaused = true;

            console.log(
                "Playback paused"
            );

        } else if (state === "PAUSED") {

            webapis.avplay.play();

            isChannelPaused = false;

            console.log(
                "Playback resumed"
            );
        }

    } catch (error) {

        console.error(
            "Play/Pause error:",
            error
        );
    }
}


function handleBackButton() {

    /*
     * If a channel is playing,
     * stop it and return to channel list.
     */

    if (isChannelPlaying) {

        stopCurrentChannel();

        return;
    }


    /*
     * If no channel is playing,
     * exit the application.
     */

    if (
        typeof tizen !== "undefined" &&
        tizen.application
    ) {

        try {

            tizen.application
                .getCurrentApplication()
                .exit();

        } catch (error) {

            console.error(
                "Could not exit application:",
                error
            );
        }
    }
}


function stopCurrentChannel() {

    if (
        typeof webapis !== "undefined" &&
        webapis.avplay
    ) {

        try {

            var state =
                webapis.avplay.getState();


            if (
                state === "PLAYING" ||
                state === "PAUSED" ||
                state === "READY"
            ) {

                webapis.avplay.stop();
            }


            if (
                webapis.avplay.getState() !==
                "NONE"
            ) {

                webapis.avplay.close();
            }

        } catch (error) {

            console.error(
                "Stop playback error:",
                error
            );
        }
    }


    isChannelPlaying = false;
    isChannelPaused = false;


    var placeholder =
        document.getElementById(
            "player-placeholder"
        );

    var loading =
        document.getElementById(
            "player-loading"
        );

    var errorBox =
        document.getElementById(
            "player-error"
        );


    placeholder.classList.remove(
        "hidden"
    );

    loading.classList.add(
        "hidden"
    );

    errorBox.classList.add(
        "hidden"
    );


    var channels =
        document.querySelectorAll(
            ".channel-card"
        );


    if (channels.length > 0) {

        channels[0].focus();
    }
}


    setupRemoteNavigation();
}


function setupRemoteNavigation() {

    var categories =
        document.querySelectorAll(
            ".category-item"
        );

    var channelCards =
        document.querySelectorAll(
            ".channel-card"
        );


    /*
     * CATEGORY NAVIGATION
     */

    for (
        var i = 0;
        i < categories.length;
        i++
    ) {

        categories[i].onkeydown =
            function (event) {

                var current =
                    Array.prototype.indexOf.call(
                        categories,
                        this
                    );


                // UP
                if (event.keyCode === 38) {

                    event.preventDefault();

                    if (current > 0) {

                        categories[
                            current - 1
                        ].focus();
                    }
                }


                // DOWN
                else if (event.keyCode === 40) {

                    event.preventDefault();

                    if (
                        current <
                        categories.length - 1
                    ) {

                        categories[
                            current + 1
                        ].focus();
                    }
                }


                // RIGHT -> CHANNELS
                else if (event.keyCode === 39) {

                    event.preventDefault();

                    if (
                        channelCards.length > 0
                    ) {

                        channelCards[0].focus();
                    }
                }


                // ENTER / OK
                else if (event.keyCode === 13) {

                    event.preventDefault();

                    this.click();
                }
            };
    }


    /*
     * CHANNEL NAVIGATION
     */

    for (
        var j = 0;
        j < channelCards.length;
        j++
    ) {

        channelCards[j].onkeydown =
            function (event) {

                var current =
                    Array.prototype.indexOf.call(
                        channelCards,
                        this
                    );


                // UP
                if (event.keyCode === 38) {

                    event.preventDefault();

                    if (current > 0) {

                        channelCards[
                            current - 1
                        ].focus();

                        channelCards[
                            current - 1
                        ].scrollIntoView({
                            block: "nearest"
                        });
                    }
                }


                // DOWN
                else if (event.keyCode === 40) {

                    event.preventDefault();

                    if (
                        current <
                        channelCards.length - 1
                    ) {

                        channelCards[
                            current + 1
                        ].focus();

                        channelCards[
                            current + 1
                        ].scrollIntoView({
                            block: "nearest"
                        });
                    }
                }


                // LEFT -> CATEGORIES
                else if (event.keyCode === 37) {

                    event.preventDefault();

                    var activeCategory =
                        document.querySelector(
                            ".category-item.active"
                        );

                    if (activeCategory) {

                        activeCategory.focus();
                    }
                }


                // ENTER / OK
                else if (event.keyCode === 13) {

                    event.preventDefault();

                    this.click();
                }
            };
    }


    /*
     * INITIAL FOCUS
     */

    if (
        categories.length > 0 &&
        !document.activeElement.classList.contains(
            "category-item"
        ) &&
        !document.activeElement.classList.contains(
            "channel-card"
        )
    ) {

        categories[0].focus();
    }
}


function showChannelInfo(channel) {

    var player =
        document.getElementById(
            "player-placeholder"
        );

    player.innerHTML =
        "<div class='large-play'>▶</div>" +
        "<h2>" +
        escapeHTML(channel.name) +
        "</h2>" +
        "<p>" +
        escapeHTML(channel.group) +
        "</p>";
}


function playChannel(channel) {

    var placeholder =
        document.getElementById(
            "player-placeholder"
        );

    var loading =
        document.getElementById(
            "player-loading"
        );

    var errorBox =
        document.getElementById(
            "player-error"
        );

    errorBox.classList.add("hidden");
    loading.classList.remove("hidden");


    if (
        typeof webapis === "undefined" ||
        !webapis.avplay
    ) {

        loading.classList.add("hidden");

        errorBox.textContent =
            "AVPlay is not available. Playback must be tested on a Samsung Tizen TV.";

        errorBox.classList.remove("hidden");

        console.log(
            "AVPlay unavailable in this environment."
        );

        return;
    }


    try {

        try {

            var state =
                webapis.avplay.getState();

            if (
                state !== "NONE" &&
                state !== "IDLE"
            ) {
                webapis.avplay.stop();
            }

            if (state !== "NONE") {
                webapis.avplay.close();
            }

        } catch (previousError) {

            console.log(
                "No previous stream to close."
            );
        }


        webapis.avplay.open(
            channel.url
        );


        webapis.avplay.setListener({

            onbufferingstart: function () {

                loading.classList.remove(
                    "hidden"
                );

                loading.textContent =
                    "Loading...";
            },


            onbufferingprogress: function (percent) {

                loading.textContent =
                    "Loading " +
                    percent +
                    "%";
            },


            onbufferingcomplete: function () {

                loading.classList.add(
                    "hidden"
                );
            },


            onstreamcompleted: function () {

                console.log(
                    "Stream completed"
                );
            },


            oncurrentplaytime: function (currentTime) {

            },


            onerror: function (eventType) {

                console.error(
                    "AVPlay error:",
                    eventType
                );

                loading.classList.add(
                    "hidden"
                );

                errorBox.textContent =
                    "Unable to play this channel.";

                errorBox.classList.remove(
                    "hidden"
                );
            },


            onevent: function (
                eventType,
                eventData
            ) {

                console.log(
                    "AVPlay event:",
                    eventType,
                    eventData
                );
            },


            onsubtitlechange: function () {

            },


            ondrmevent: function () {

            }

        });


        webapis.avplay.setDisplayRect(
            780,
            90,
            1140,
            935
        );


        webapis.avplay.prepareAsync(

            function () {

                console.log(
                    "AVPlay prepared"
                );

                placeholder.classList.add(
                    "hidden"
                );

                loading.classList.add(
                    "hidden"
                );

                webapis.avplay.play();
                isChannelPlaying = true;
isChannelPaused = false;
            },


            function (error) {

                console.error(
                    "Prepare error:",
                    error
                );

                loading.classList.add(
                    "hidden"
                );

                errorBox.textContent =
                    "Stream could not be prepared.";

                errorBox.classList.remove(
                    "hidden"
                );
            }

        );


    } catch (error) {

        console.error(
            "Playback error:",
            error
        );

        loading.classList.add(
            "hidden"
        );

        errorBox.textContent =
            "Playback error: " +
            error.message;

        errorBox.classList.remove(
            "hidden"
        );
    }
}


function setupRemoteNavigation() {

    var focusable =
        document.querySelectorAll(
            ".category-item, .channel-card"
        );


    if (focusable.length > 0) {

        focusable[0].focus();
    }
}


function showStatus(message, type) {

    var status =
        document.getElementById(
            "status-message"
        );


    status.className =
        type || "";

    status.textContent =
        message;
}


function escapeHTML(value) {

    var div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;
}