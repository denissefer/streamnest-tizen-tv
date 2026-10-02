var channels = [];
var currentChannels = [];
var currentCategory = "All Channels";


document.addEventListener("DOMContentLoaded", function () {

    console.log("StreamNest started");

    startClock();

    setupWelcomeScreen();

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


    setupRemoteNavigation();
}


function selectChannel(channel) {

    console.log(
        "Selected:",
        channel.name,
        channel.url
    );


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