const isMobile = document.documentElement.clientWidth < 768;
const isTablet = document.documentElement.clientWidth < 1140;

function isWebp() {
    // Проверка поддержки webp
    const testWebp = (callback) => {
        const webP = new Image();

        webP.onload = webP.onerror = () => callback(webP.height === 2);
        webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    };

    // Добавление класса _webp или _no-webp для HTML
    testWebp((support) => {
        const className = support ? 'webp' : 'no-webp';
        document.querySelector('html').classList.add(className);
        console.log(support ? 'webp поддерживается' : 'webp не поддерживается');
    });
}

isWebp();

function initCopyCode() {
    let codes = document.querySelectorAll('.code__body');
    codes.forEach((elem) => {
        elem.addEventListener('click', (event) => {
            UIkit.notification.closeAll()
            navigator.clipboard.writeText(elem.innerText).then(function() {
                UIkit.notification({
                    message: 'Код успешно скопирован',
                    status: 'primary',
                    pos: 'bottom-center',
                    group: false,
                    timeout: 5000
                });
            }, function(err) {
                console.error('Произошла ошибка при копировании текста: ', err);
            });
        })
    })
}

document.addEventListener('DOMContentLoaded', (event) => {
    initCopyCode();
})