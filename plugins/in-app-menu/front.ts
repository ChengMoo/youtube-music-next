import { ipcRenderer, Menu } from 'electron';
// eslint-disable-next-line import/no-unresolved
import { Color, Titlebar } from 'custom-electron-titlebar';

import config from '../../config';
import { isEnabled } from '../../config/plugins';

function $(selector: string) {
  return document.querySelector(selector);
}

export default () => {
  const visible = () => !!($('.cet-menubar')?.firstChild);
  const bar = new Titlebar({
    icon: 'https://cdn-icons-png.flaticon.com/512/5358/5358672.png',
    backgroundColor: Color.fromHex('#050505'),
    itemBackgroundColor: Color.fromHex('#1d1d1d') ,
    svgColor: Color.WHITE,
    menu: config.get('options.hideMenu') ? null as unknown as Menu : undefined,
  });
  bar.updateTitle(' ');
  document.title = 'Youtube Music';

  const toggleMenu = () => {
    if (visible()) {
      bar.updateMenu(null as unknown as Menu);
    } else {
      bar.refreshMenu();
    }
  };

  $('.cet-window-icon')?.addEventListener('click', toggleMenu);
  ipcRenderer.on('toggleMenu', toggleMenu);

  ipcRenderer.on('refreshMenu', () => {
    if (visible()) {
      bar.refreshMenu();
    }
  });

  if (isEnabled('picture-in-picture')) {
    ipcRenderer.on('pip-toggle', () => {
      bar.refreshMenu();
    });
  }

  // Increases the right margin of Navbar background when the scrollbar is visible to avoid blocking it (z-index doesn't affect it)
  document.addEventListener('apiLoaded', () => {
    setNavbarMargin();
    const playPageObserver = new MutationObserver(setNavbarMargin);
    const appLayout = $('ytmusic-app-layout');
    if (appLayout) {
      playPageObserver.observe(appLayout, { attributeFilter: ['player-page-open_', 'playerPageOpen_'] });
    }
    setupSearchOpenObserver();
    setupMenuOpenObserver();
  }, { once: true, passive: true });
};

function setupSearchOpenObserver() {
  const searchOpenObserver = new MutationObserver((mutations) => {
    ($('#nav-bar-background') as HTMLElement)
      .style
      .setProperty(
        '-webkit-app-region',
        (mutations[0].target as HTMLElement & { opened: boolean }).opened ? 'no-drag' : 'drag',
      );
  });
  const searchBox = $('ytmusic-search-box');
  if (searchBox) {
    searchOpenObserver.observe(searchBox, { attributeFilter: ['opened'] });
  }
}

function setupMenuOpenObserver() {
  const cetMenubar = $('.cet-menubar');
  if (cetMenubar) {
    const menuOpenObserver = new MutationObserver(() => {
      ($('#nav-bar-background') as HTMLElement)
        .style
        .setProperty(
          '-webkit-app-region',
          Array.from(cetMenubar.childNodes).some((c) => (c as HTMLElement).classList.contains('open')) ? 'no-drag' : 'drag',
        );
    });
    menuOpenObserver.observe(cetMenubar, { subtree: true, attributeFilter: ['class'] });
  }
}

function setNavbarMargin() {
  const navBarBackground = $('#nav-bar-background') as HTMLElement;
  navBarBackground.style.right
    = ($('ytmusic-app-layout') as HTMLElement & { playerPageOpen_: boolean }).playerPageOpen_
    ? '0px'
    : '12px';
}
