function i18nLoader() {
    const elementList = document.querySelectorAll("[data-i18n]");
    elementList.forEach(function (element) {
        element.innerText = chrome.i18n.getMessage(element.dataset.i18n)
    })
}
window.addEventListener('DOMContentLoaded', i18nLoader);