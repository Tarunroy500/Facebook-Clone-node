const menuItem = document.querySelectorAll(".menu-item");
var overlay = document.querySelector(".overlay");
var btnoverlay = document.querySelector(".createpost");
var home_btn = document.querySelector(".home-btn");
const message = document.querySelector("#message");
const messageBox = document.querySelector("#message-box");
const themeMenu = document.querySelector("#themeMenu");
const themBOx = document.querySelector(".theme");
const addBtn = document.querySelectorAll("#add");
const delbtn = document.querySelectorAll("#del");
const searchinp = document.querySelector(".searchinp");
const searchbox = document.querySelector(".searchbox");
const overlay2 = document.querySelector(".overlay2");
const feeds = document.querySelector(".feeds");
const loadbtn = document.querySelector(".load-more");
var bookmark_btn = document.querySelector(".bookmark-btn");
var temp = "";
var count = 0;
var posts = [];
var user = {};

home_btn.addEventListener("click", () => {
  fetchPost(count);
});

btnoverlay.addEventListener("click", () => {
  overlay.style.display = "block";
});
overlay.addEventListener("click", (e) => {
  if (
    e.target.classList.contains("overlay") ||
    e.target.classList.contains("cross")
  ) {
    overlay.style.display = "none";
  }
});
// remove active classlist.....
const removeActive = () => {
  menuItem.forEach((item) => {
    item.classList.remove("active");
  });
};

// add active classlist.....
menuItem.forEach((item) => {
  item.addEventListener("click", () => {
    removeActive();
    item.classList.add("active");

    if (item.id != "notifice") {
      document.querySelector(".notification").style.display = "none";
    } else {
      document.querySelector(".notification").style.display = "block";
      document.querySelector("#notifice .count").style.display = "none";
    }
  });
});

message.addEventListener("click", () => {
  messageBox.classList.add("box-sh");
  message.querySelector(".count").style.display = "none";

  setTimeout(() => {
    messageBox.classList.remove("box-sh");
  }, 2000);
});

addBtn.forEach((element) => {
  element.addEventListener("click", () => {
    element.parentElement.style.display = "none";
  });
});

delbtn.forEach((element) => {
  element.addEventListener("click", () => {
    element.parentElement.parentElement.style.display = "none";
  });
});

// WINDOW EVENT.....
window.addEventListener("scroll", () => {
  themBOx.style.display = "none";
  document.querySelector(".notification").style.display = "none";
});

//  Search bar

searchinp.addEventListener("keydown", (e) => {
  console.log(e.target.value);
  if (e.target.value.length > 0) {
    axios.get(`/username/${e.target.value}`).then((res) => {
      searchbox.innerHTML = "";
      console.log(res.data);
      res.data.founduser.forEach((user) => {
        searchbox.innerHTML += `<a href="/profile/${user._id}" class="user">
        <div class="img-cnt">
          <img src="${user.profile_picture}" alt="" />
        </div>
        <p>${user.first_name} ${user.last_name}</p>
      </a>`;
      });
    });
  }
});
searchinp.addEventListener("focusout", () => {
  setTimeout(() => {
    searchbox.innerHTML = "";
  }, 500);
});

// Single post with comment and like

feeds.addEventListener("click", async (e) => {
  if (e.target.classList.contains("comment")) {
    const { data } = await axios.get(`/post/${e.target.id}`);
    overlay2.style.display = "block";
    document.body.style.overflow = "hidden";
    overlay2.innerHTML = `<div class="comment-popup-container">
    <ul class="comments-list">
    ${
      data.post.comments.length === 0
        ? `<li class="comment">
      <div class="comment-details">
        <h4 class="comment-username">No Comments</h4>
      </div>
    </li>`
        : ""
    }
      ${data.post.comments.map(
        (comment) =>
          `<li class="comment">
        <img class="comment-avatar" src="${
          comment.author.profile_picture
        }" alt="" />
        <a class="comment-details" href="/profile/${comment.author._id}">
          <h4 class="comment-username">${comment.author.first_name} ${
            comment.author.last_name
          }</h4>
          <p class="comment-text">${comment.comment}</p>
        </a>
        ${
          comment.author._id === data.user._id
            ? `<a href="/deletecomment/${data.post._id}/${comment._id}">
        <button class="delete-comment">Delete</button>
      </a>`
            : ""
        } 
      </li>`
      )}
    </ul>
    <form class="comment-form" action="/comment/${data.post._id}" method="POST">
      <textarea name="comment" class="comment-textarea" placeholder="Write a comment..."></textarea>
      <button class="comment-button">Post</button>
    </form>
  </div>`;
  } else if (e.target.classList.contains("like")) {
    handleLike(e.target.id);
  } else if (e.target.classList.contains("book-mark")) {
    handleBookmark(e.target.id);
  }
});
overlay2.addEventListener("click", (e) => {
  if (
    e.target.classList.contains("overlay2") ||
    e.target.classList.contains("cross")
  ) {
    overlay2.style.display = "none";
    document.body.style.overflow = "auto";
  }
});

const fetchPost = async (page) => {
  var limit = 15;
  const { data } = await axios.get(`/feeds/${page}/${limit}`);
  posts.push(...data.posts);
  user = data.user;
  feeds.innerHTML = handleloop(data);
  count += 1;
};

const handleLike = async (e) => {
  await axios.get(`/like/${e}`);
  posts.forEach((post) => {
    if (post._id == e) {
      if (post.likes.includes(user._id)) {
        post.likes = post.likes.filter((id) => id != user._id);
      } else {
        post.likes.push(user._id);
      }
    }
  });
  temp = "";
  feeds.innerHTML = handleloop({ posts, user });
  // window.location.reload();
};

const handleBookmark = async (e) => {
  console.log(posts);
  await axios.get(`/saved_posts/${e}`);
  if (user.bookmarks.includes(e)) {
    user.bookmarks = user.bookmarks.filter((id) => id != e);
  } else {
    user.bookmarks.push(e);
  }
  temp = "";
  feeds.innerHTML = handleloop({ posts, user });
  // window.location.reload();
};

const handleloop = (data) => {
  data.posts.forEach((post) => {
    temp += `<div class="feed">
        <div class="head">
          <a class="user" href="/profile/${post.author._id}">
            <div class="profile-phots">
              <img src="${post.author.profile_picture}" alt="" />
            </div>
            <div class="info">
              <h3>
                 ${post.author.first_name} ${post.author.last_name} 
              </h3>
              <small>${new Date(post.date).toTimeString()}</small>
            </div>
          </a>
          ${
            post.author._id.toString() == data.user._id.toString()
              ? `<a class="edit" href="/deletepost/${post._id}">
            <img
              src="../images/../images/icon/three-dots.svg"
              class="icon1"
            />
          </a>`
              : ""
          }
        </div>
        ${
          post.filetype == "image"
            ? `<a href="/singlepost/${post._id}" class="feed-phots">
        <img src="${post.file}" alt="" />
      </a>`
            : ""
        }
        ${
          post.filetype == "video"
            ? `<a href="/singlepost/${post._id}" class="feed-phots">
          <video controls>
            <source src="${post.file}" type="video/mp4" />
          </video>
        </a>`
            : ""
        }
        ${
          post.filetype == undefined
            ? `<a href="/singlepost/${post._id}" class="feed-phots">
          <h1>${post.title}</h1>
        </a>`
            : ""
        }
        <div class="action-buttons">
          <div class="inter-action-button">
            <div id="${post._id}" class="like">
              ${
                post.likes.includes(data.user._id)
                  ? `<img
                src="../images/../images/icon/heart-fill.svg"
                class="icon2 like"
                id="${post._id}"
              />`
                  : `<img
                src="../images/../images/icon/heart.svg"
                class="icon2 like"
                id="${post._id}"
              />`
              }
            </div>
            <span>
              <img
                src="../images/icon/chat-dots.svg"
                class="icon2 comment"
                id="${post._id}"
                style="margin-bottom: 0;"
              />
            </span>
            <a href="http://web.whatsapp.com/send?text=http://localhost:3000/singlepost/${
              post._id
            }" target="_blank">
            <img
                src="../images/icon/share.svg"
                class="icon2"
            />
            </a>
          </div>
          <div class="book-mark" id="${post._id}">
            <span>
            ${
              data.user.bookmarks.includes(post._id)
                ? ` <img
              src="../images/icon/bookmark-fill.svg"
              class="icon2 book-mark filled-bookmark"
              id="${post._id}"
              />`
                : `<img
                src="../images/icon/bookmark.svg"
                class="icon2 book-mark"
                id="${post._id}"
                />`
            }
            </span>
          </div>
        </div>
        <div class="liked-by">
          <span><img src="../images/img/p2.jpg" alt="" /></span>
          <span><img src="../images/img/p4.png" alt="" /></span>
          <span><img src="../images/img/p5.png" alt="" /></span>
          <b>&nbsp;${post.likes.length} Likes</b>
        </div>
          ${
            post.filetype
              ? `
        <div class="caption">
          <p>
            <b>${post.title ? post.author.first_name : ""} </b>
                ${post.title}
          </p>
        </div>`
              : ""
          }
        <div class="text-gry comment" id="${post._id}">
          view all comments
        </div>
      </div>`;
  });
  return temp;
};

fetchPost(count);
loadbtn.addEventListener("click", () => {
  fetchPost(count);
});

const sharePost = () => {
  if (navigator.share) {
    navigator
      .share({
        title: "Social Media",
        text: "Check out this post on Social Media",
        url: `https://social-media-website.herokuapp.com/singlepost/`,
      })
      .then(() => {
        alert("Link Copied");
      })
      .catch(console.error);
  } else {
    alert("Your browser does not support this feature");
  }
};

bookmark_btn.addEventListener("click", async () => {
  const { data } = await axios.get(`/bookmarks`);
  posts = data.posts;
  temp = "";
  feeds.innerHTML = handleloop(data);
});
