// const tabs = document.querySelectorAll('.tab');
// const tabContents = document.querySelectorAll('.tab-content');

// tabs.forEach((tab) => {
//   tab.addEventListener('click', () => {
//     const target = tab.dataset.target;
//     tabContents.forEach((tabContent) => {
//       if (tabContent.getAttribute('id') === target) {
//         tabContent.classList.add('active');
//       } else {
//         tabContent.classList.remove('active');
//       }
//     });
//     tabs.forEach((tab) => {
//       if (tab.dataset.target === target) {
//         tab.classList.add('active');
//       } else {
//         tab.classList.remove('active');
//       }
//     });
//   });
// });

let sidebarNav = document.querySelector('.sidebar-nav');
let sidebarOpenBtn = document.querySelector('.sidebar-open-btn');
let sidebarCloseBtn = document.querySelector('.sidebar-close-btn');

sidebarOpenBtn.addEventListener('click', () => {
  sidebarNav.classList.add('open');
});

sidebarCloseBtn.addEventListener('click', () => {
  sidebarNav.classList.remove('open');
});
