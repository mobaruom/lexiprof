alert("APP JS OK");

document.addEventListener("DOMContentLoaded", () => {
    alert("DOM OK");

    const loader = document.querySelector(".global-loader");

    if (loader) {
        loader.classList.add("hidden");

        setTimeout(() => {
            loader.remove();
        }, 300);
    }

    const container = document.getElementById("cardsContainer");

    if (container) {
        container.innerHTML = `
            <div style="padding:40px;text-align:center">
                <h2>LexiProf fonctionne 🎉</h2>
                <p>Le problème vient bien de l'ancien app.js.</p>
            </div>
        `;
    }
});