import { utilities } from './graphQLMutations/utility.js';
import { cartMutations } from './graphQLMutations/cartMutations.js';
import { userMutations } from './graphQLMutations/userMutations.js';
import { updateCartPage } from './decorators/decorate-cart.js';
import { loadMyOrders, updateOnLogOut } from './load-orders.js';

const updateToken = async (activeUserCreds) => {
    if (!utilities.getTokenFromSS()) {
        const token = await userMutations.getUserToken(activeUserCreds.email, activeUserCreds.password);
        utilities.setTokentoSS(token.token)
    }
}

const updateCartDetailsOnLoad = async (isLoggedIn = false) => {
    if (isLoggedIn) {
        let cartQuantity = 0;
        const cartID = utilities.getCartIDFromSS();
        let isError = false;

        let cart = await cartMutations.getCustomerCart();

        if (cart.errors) {
            isError = true;
            if (cart.errors[0].extensions?.category == 'graphql-authorization') {
                await userMutations.regenerateUserToken();
                cart = await cartMutations.getCustomerCart();
                isError = false;
            }
            console.log(cart.errors);
        }
        if (!isError) {
            utilities.setCartIDtoSS(cart.id);
            if (cartID && cart && cart.id !== cartID) {
                const newCart = await cartMutations.mergeCarts(cartID, cart.id)
                cartQuantity = newCart.total_quantity;
            } else if (cart.total_quantity) {
                cartQuantity = cart.total_quantity;
            }
            utilities.setCartQuantityToSS(cartQuantity);
        }
    }
    utilities.updateCartCountOnUI();
}

const onLoginHandler = async (activeUser, activeUserCreds) => {
    utilities.setActiveUsertoSS(activeUser);

    await updateToken(activeUserCreds);
    await updateCartDetailsOnLoad(true);

    if (location.href.includes('cart')) {
        await updateCartPage();
    }
    if (location.href.includes('my-orders')) {
        await loadMyOrders();
    }
}

const onLogoutHandler = async () => {
    utilities.removeCartQuantityFromSS();
    utilities.removeActiveUserFromSS();
    utilities.removeCartIDFromSS();
    updateCartDetailsOnLoad();

    if (location.href.includes('cart')) {
        await updateCartPage();
    }
    if (location.href.includes('my-orders')) {
        updateOnLogOut();
    }
}

async function signIn(user) {
    const activeUserCreds = user == 'user01' ? utilities.user01 : utilities.user02;
    await onLoginHandler(user, activeUserCreds);

    const userToken = utilities.getTokenFromSS();
    const firstname = activeUserCreds.firstname;

    if (userToken !== null) {
        const loggedTitle = document.querySelector('.close-title h5');
        const signInInfo = document.querySelector('.sign-in-information');
        const loggedUser = document.querySelector('.logged-user');
        const welcomeMsg = document.querySelector('.welcome-message');
        const logOutBtn = document.querySelector('.sign-in-buttons button');

        loggedTitle.innerHTML = 'Profile';
        welcomeMsg.innerHTML = `Welcome, ${firstname}!`;
        signInInfo.classList.add('hidden');
        loggedUser.classList.remove('hidden');
        logOutBtn.classList.remove('hidden');
    }
}

function createSignIn() {
    const activeUser = utilities.getActiveUserFromSS();

    let activeUserCreds, userName;

    if (activeUser !== null) {
        activeUserCreds = activeUser == 'user01' ? utilities.user01 : utilities.user02;
        userName = activeUserCreds.firstname;
    }

    let navTools = document.querySelector('.nav');
    let signInHtml = document.createElement("div");

    signInHtml.classList.add(...['sign-in', 'absolute', 'md:right-4', 'w-full', 'md:w-100', 'z-10', 'bg-white', 'hidden', 'shadow-sm']);

    signInHtml.innerHTML = `
      <div class ="sign-in-wrapper px-6 py-4 grid gap-4 w-full">
        <div class="close-title flex items-center justify-between">
          <h5 class="w-full  sign-in-message">${activeUser ? 'Profile' : 'Sign-In To Your Account'}</h5>
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" fill="currentColor" width="16" height="16" viewBox="0 0 24 24">
          <path d="M 4.9902344 3.9902344 A 1.0001 1.0001 0 0 0 4.2929688 5.7070312 L 10.585938 12 L 4.2929688 18.292969 A 1.0001 1.0001 0 1 0 5.7070312 19.707031 L 12 13.414062 L 18.292969 19.707031 A 1.0001 1.0001 0 1 0 19.707031 18.292969 L 13.414062 12 L 19.707031 5.7070312 A 1.0001 1.0001 0 0 0 18.980469 3.9902344 A 1.0001 1.0001 0 0 0 18.292969 4.2929688 L 12 10.585938 L 5.7070312 4.2929688 A 1.0001 1.0001 0 0 0 4.9902344 3.9902344 z"></path>
          </svg>
        </div>
        <form class="sign-in-information flex justify-center gap-4 ${activeUser ? 'hidden' : ''}">
          <small class="hidden">The account sign-in was incorrect or your account is disabled temporarily. Please wait and try again later.</small>
          <div class="persona1 flex flex-col items-center px-3 py-4 border rounded-md cursor-pointer">
            <span>Persona1</span>
            <svg height="24" width="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="lucide lucide-user h-5 w-5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <div class="persona2 flex flex-col items-center px-3 py-4 border rounded-md cursor-pointer">
            <span>Persona2</span>
            <svg height="24" width="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="lucide lucide-user h-5 w-5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
        </form>
        <div class="logged-user ${activeUser ? '' : 'hidden'}"">
          <span class="welcome-message">${activeUser ? `Welcome, ${userName}!` : ''}</span>
          <br/>
          <a href="/my-orders.html" >My orders</a>
        </div>
        <div class="sign-in-buttons flex items-center flex-col flex-wrap">
          <button type="submit" id="log-out" class="${activeUser ? '' : 'hidden'} text-dsg-red">Log Out</button>
        </div>
      </div>
    `;
    navTools.append(signInHtml);

    const persona1 = document.querySelector('.persona1');
    const persona2 = document.querySelector('.persona2');
    const closeBtn = document.querySelector('.close-title svg');
    const logOutBtn = document.querySelector('#log-out');
    const loggedTitle = document.querySelector('.close-title h5');
    const signInInfo = document.querySelector('.sign-in-information');
    const loggedUser = document.querySelector('.logged-user');

    persona1.addEventListener('click', () => {
        signIn("user01");
    });
    persona2.addEventListener('click', () => {
        signIn("user02");
    });

    closeBtn.addEventListener('click', () => {
        document.querySelector('.sign-in').classList.add('hidden');
    });

    logOutBtn.addEventListener('click', async () => {
        loggedTitle.innerHTML = 'Sign-In To Your Account';
        signInInfo.classList.remove('hidden');
        loggedUser.classList.add('hidden');
        logOutBtn.classList.add('hidden');
        await onLogoutHandler();
    });
}

function importSearch() {
    import('./autocomplete-init.js');
}

function initHeader() {
    const navBlock = document.querySelector('.nav');
    const logo = navBlock.querySelector('.logo');

    const pictureBlock = logo.querySelector('picture');

    let anchorElement = document.createElement('a');
    anchorElement.setAttribute('href', '/');
    anchorElement.append(pictureBlock.cloneNode(true));

    logo.replaceWith(anchorElement);

    const logoAsset = anchorElement.querySelector('img');
    logoAsset.classList.add(...['h-10', 'w-27']);

    const container = document.createElement('div');
    container.classList.add(...['container', 'mx-auto', 'px-4', 'py-4']);

    const containerInner = document.createElement('div');
    containerInner.classList.add(
        ...['flex', 'items-center', 'justify-between'],
    );
    while (navBlock.firstElementChild) {
        containerInner.append(navBlock.firstElementChild);
    }

    const classes = ['brand', 'sections'];
    classes.forEach((className, index) => {
        const section = containerInner.children[index];
        if (section) {
            section.classList.add(`nav-${className}`);

            if (index === 1) {
                section.classList.add(
                    ...['hidden', 'md:flex', 'items-center', 'space-x-8'],
                );
            }
        }
    });

    const navSections = containerInner.querySelector('.nav-sections');
    const navigation = document.createElement('nav');

    if (navSections) {
        const unorderedList = navSections.querySelector('ul');
        unorderedList.classList.add(...['flex', 'space-x-6']);

        const url = 'https://main--psgdemoue--prftadobe.aem.live';
        const anchorLinks = navSections.querySelectorAll('a');
        Array.from(anchorLinks).forEach((anchorLink) => {
            anchorLink.classList.add(...['hover:text-dsg-red']);

            const href = anchorLink.getAttribute('href');

            if (href.startsWith('/')) {
                anchorLink.setAttribute('href', `${url}${href}`);
            }
        });

        while (navSections.firstChild) {
            navigation.appendChild(navSections.firstChild);
        }
        navSections.appendChild(navigation);
    }

    const navTools = document.createElement('div');
    navTools.classList.add(
        ...['flex', 'items-center', 'md:space-x-4', 'space-x-2'],
    );

    const buttonClassList = [
        '[&_svg]:pointer-events-none',
        '[&_svg]:shrink-0',
        '[&_svg]:size-4',
        'disabled:opacity-50',
        'disabled:pointer-events-none',
        'focus-visible:outline-hidden',
        'focus-visible:ring-2',
        'focus-visible:ring-offset-2',
        'focus-visible:ring-ring',
        'font-medium',
        'gap-2',
        'h-10',
        'hover:bg-accent',
        'hover:text-accent-foreground',
        'inline-flex',
        'items-center',
        'justify-center',
        'ring-offset-background',
        'rounded-md',
        'text-sm',
        'transition-colors',
        'w-10',
        'whitespace-nowrap',
    ];

    const accountButton = document.createElement('button');
    accountButton.classList.add(...buttonClassList, ...['relative']);
    accountButton.setAttribute('type', 'button');
    accountButton.setAttribute('aria-label', 'accountbutton');

    const accountIcon = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
    );
    accountIcon.setAttribute('height', '24');
    accountIcon.setAttribute('width', '24');
    accountIcon.setAttribute('viewBox', '0 0 24 24');
    accountIcon.setAttribute('fill', 'none');
    accountIcon.setAttribute('stroke', 'currentColor');
    accountIcon.setAttribute('stroke-linecap', 'round');
    accountIcon.setAttribute('stroke-linejoin', 'round');
    accountIcon.setAttribute('stroke-width', '2');
    accountIcon.classList.add(...['lucide', 'lucide-user', 'h-5', 'w-5']);

    const accountPath = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
    );
    accountPath.setAttribute(
        'd',
        'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2',
    );

    const accountCircle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle',
    );
    accountCircle.setAttribute('cx', '12');
    accountCircle.setAttribute('cy', '7');
    accountCircle.setAttribute('r', '4');

    accountIcon.append(accountPath);
    accountIcon.append(accountCircle);

    accountButton.append(accountIcon);
    accountButton.addEventListener('click', () => {
        document.querySelector('.sign-in').classList.toggle('hidden');
    })

    const cartButton = document.createElement('a');

    cartButton.classList.add(...buttonClassList, ...['relative']);
    cartButton.setAttribute('type', 'button');
    cartButton.setAttribute('aria-label', 'carbutton');

    const cartIcon = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
    );
    cartIcon.setAttribute('height', '24');
    cartIcon.setAttribute('width', '24');
    cartIcon.setAttribute('viewBox', '0 0 24 24');
    cartIcon.setAttribute('fill', 'none');
    cartIcon.setAttribute('stroke', 'currentColor');
    cartIcon.setAttribute('stroke-linecap', 'round');
    cartIcon.setAttribute('stroke-linejoin', 'round');
    cartIcon.setAttribute('stroke-width', '2');

    cartIcon.classList.add(
        ...['lucide', 'lucide-shopping-cart', 'h-5', 'w-5'],
    );

    const cartCircleOne = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle',
    );
    cartCircleOne.setAttribute('cx', '8');
    cartCircleOne.setAttribute('cy', '21');
    cartCircleOne.setAttribute('r', '1');

    const cartCircleTwo = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle',
    );
    cartCircleTwo.setAttribute('cx', '19');
    cartCircleTwo.setAttribute('cy', '21');
    cartCircleTwo.setAttribute('r', '1');

    const cartPath = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
    );
    cartPath.setAttribute(
        'd',
        'M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12',
    );

    cartIcon.append(cartCircleOne);
    cartIcon.append(cartCircleTwo);
    cartIcon.append(cartPath);

    cartButton.append(cartIcon);

    const cartQuantity = utilities.getCartQuantityFromSS();
    const cartQuantityBadge = document.createElement('label');
    cartQuantityBadge.classList.add('cart-quantity', 'w-4', 'h-4', 'rounded-full', 'bg-red-600', 'text-white', 'text-[10px]', 'absolute', 'right-0.5', 'top-1', 'text-center');
    cartQuantityBadge.innerText = cartQuantity ? cartQuantity : 0;

    cartButton.append(cartQuantityBadge);
    cartButton.href = "/cart.html";

    const containerMob = document.createElement('div');
    containerMob.classList.add(...['hidden', 'mt-4', 'pb-4']);

    const hamburgerBtn = document.createElement('button');

    hamburgerBtn.classList.add(...buttonClassList, ...['md:hidden']);
    hamburgerBtn.setAttribute('type', 'button');
    hamburgerBtn.setAttribute('aria-label', 'hamburgerbutton');

    const hamburgerIcon = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
    );
    hamburgerIcon.setAttribute('height', '24');
    hamburgerIcon.setAttribute('width', '24');
    hamburgerIcon.setAttribute('viewBox', '0 0 24 24');
    hamburgerIcon.setAttribute('fill', 'none');
    hamburgerIcon.setAttribute('stroke', 'currentColor');
    hamburgerIcon.setAttribute('stroke-linecap', 'round');
    hamburgerIcon.setAttribute('stroke-linejoin', 'round');
    hamburgerIcon.setAttribute('stroke-width', '2');

    hamburgerIcon.classList.add(...['lucide', 'lucide-menu', 'h-5', 'w-5']);

    const hamburgerLineOne = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
    );
    hamburgerLineOne.setAttribute('x1', '4');
    hamburgerLineOne.setAttribute('x2', '20');
    hamburgerLineOne.setAttribute('y1', '12');
    hamburgerLineOne.setAttribute('y2', '12');

    const hamburgerLineTwo = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
    );
    hamburgerLineTwo.setAttribute('x1', '4');
    hamburgerLineTwo.setAttribute('x2', '20');
    hamburgerLineTwo.setAttribute('y1', '6');
    hamburgerLineTwo.setAttribute('y2', '6');

    const hamburgerLineThree = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
    );
    hamburgerLineThree.setAttribute('x1', '4');
    hamburgerLineThree.setAttribute('x2', '20');
    hamburgerLineThree.setAttribute('y1', '18');
    hamburgerLineThree.setAttribute('y2', '18');

    hamburgerIcon.append(
        hamburgerLineOne,
        hamburgerLineTwo,
        hamburgerLineThree,
    );
    hamburgerBtn.append(hamburgerIcon);

    hamburgerBtn.addEventListener('click', () => {
        if (containerMob.classList.contains('hidden')) {
            containerMob.classList.remove('hidden');
            containerMob.classList.add('md:hidden');
        } else {
            containerMob.classList.remove('md:hidden');
            containerMob.classList.add('hidden');
        }
    });

    const searchButtonWrapper = document.createElement('div');
    searchButtonWrapper.classList.add(...['autocomplete']);

    navTools.append(searchButtonWrapper);
    navTools.append(accountButton);
    navTools.append(cartButton);
    navTools.append(hamburgerBtn);

    containerInner.append(navTools);

    const navMobile = document.createElement('div');
    navMobile.classList.add(...['space-y-4']);

    const mobileNavigation = navigation.querySelector('ul').cloneNode(true);
    mobileNavigation.classList.remove('space-x-6');
    mobileNavigation.classList.add(...['flex-col', 'space-y-2']);

    const mobileAnchorLinks = mobileNavigation.querySelectorAll('a');
    Array.from(mobileAnchorLinks).forEach((mobileAnchorLink) => {
        mobileAnchorLink.classList.add(...['block', 'py-2']);
    });
    navMobile.append(mobileNavigation);

    containerMob.append(navMobile);

    container.append(containerInner, containerMob);
    navBlock.append(container);
    navBlock.classList.add(
        ...['bg-white', 'border-b', 'border-gray-200', 'w-full'],
    );
}

initHeader();
importSearch();
createSignIn();

export const headerUtilities = {
    onLoginHandler,
    onLogoutHandler
}