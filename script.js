// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  child,
  get,
  update,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDBsKuWhR2o_k7Cm7ecL9_juFHOoR3lJaE",
  authDomain: "quiz-application-b802f.firebaseapp.com",
  databaseURL: "https://quiz-application-b802f-default-rtdb.firebaseio.com",
  projectId: "quiz-application-b802f",
  storageBucket: "quiz-application-b802f.firebasestorage.app",
  messagingSenderId: "931416701516",
  appId: "1:931416701516:web:40102e69367740684b52e9",
  measurementId: "G-Q9T3182XJQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);
// Reference to the 'users_details' node and insert data one by one

var final_result = [],
  question_no = 0,
  time_limit = 15,
  currentTime = 0,
  timer = null,
  correct_answer_count = 0;

var filteredData = {};

$(".quiz-container,.finish_quiz,.layeout,.result-container").hide();

async function showScoreRecords(table) {
  $(".layeout").show();
  final_result = [];
  const usersRefNormalGame = ref(database, table);
  // // Listen for changes and retrieve data
  onValue(usersRefNormalGame, (snapshot) => {
    // The snapshot.val() contains the inserted data
    const userData = snapshot.val();
    // console.log(userData);
    // console.log(userData['jagan2002']);
    for (const key in userData) {
      final_result.push({ key: key }, userData[key]);
      objectAscOrder(final_result);
    }
    filteredData = final_result.filter((item) => "correct_answer" in item);
    PrepareQuestion();
    $(".layeout").hide();
  });
}

function objectAscOrder(object) {
  // Sort the array based on 'score' in descending order and 'missed' in ascending order
  object.sort((a, b) => {
    // Sort by score in descending order
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // If scores are equal, sort by missed in ascending order
    return a.missed - b.missed;
  });
  return object;
}

// Function to retrieve data by key
async function getDataByKey(key, table) {
  $(".layeout").show();
  const usersRef = ref(database, table);
  const userKeyRef = child(usersRef, key);
  try {
    const snapshot = await get(userKeyRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();
      $(".layeout").hide();
      return userData;
    } else {
      //  console.log('No data found for key:', key);
      return null; // Indicate that no data was found
    }
  } catch (error) {
    // console.error('Error getting data:', error);
    throw error; // Rethrow the error to handle it elsewhere if needed
  }
}

// Function to update data by key
function updateDataByKey(key, table, newData) {
  $(".layeout").show();
  const usersRef = ref(database, table);
  const userKeyRef = child(usersRef, key);
  // Set the data with merge option to update only specified fields
  update(userKeyRef, newData, { merge: true })
    .then(() => {
      // console.log('Data updated successfully for key:', key);
    })
    .catch((error) => {
      // console.error('Error updating data:', error);
    });
  $(".layeout").hide();
}

async function insertDataByKey(key, table, InsertData = {}) {
  try {
    $(".layeout").show();

    // Retrieve existing data by key
    const userData = await getDataByKey(key, table);
    console.log(userData);

    if (!userData) {
      // Insert new data if key doesn't exist
      await set(ref(database, `${table}/${key}`), InsertData);
      $(".layeout").hide();
      return {
        status: 1,
        message: "Quiz configuration has been set successfully.",
      };
    } else {
      try {
        let check_certificate =
          "certificate_" + localStorage.getItem("category");
        if (
          userData[check_certificate] != undefined &&
          userData[check_certificate] == "yes"
        ) {
          return {
            status: 0,
            message: "You have already completed the quiz.",
          };
        } else if (
          userData.username == InsertData.username &&
          userData.name != InsertData.name
        ) {
          return {
            status: 0,
            message: "Username and name are invalid in the quiz.",
          };
        } else {
          return {
            status: 1,
            message: "Quiz configuration has been set successfully.",
          };
        }
      } catch (error) {
        console.log(error);
      }
      // Key already exists
      $(".layeout").hide();
    }
  } catch (error) {
    // Handle any errors
    $(".layeout").hide();
    return {
      status: 0,
      message: "Something went wrong. Please contact admin.",
    };
  }
}

$(document).on("click", "#start_quiz", async function (e) {
  let username = $("#username").val().trim();
  let name = $("#name").val().trim();
  let category = $("#category option:selected").val();

  if (username == "") {
    swalMessgae("error", "Please enter the username.", "#username");
  } else if (name == "") {
    swalMessgae("error", "Please enter the your name.", "#name");
  } else {
    localStorage.setItem("category", category);
    let check_certificate = "certificate_" + localStorage.getItem("category");
    let InsertData = { username, name, [check_certificate]: "no" };
    let response = await insertDataByKey(
      username.toLowerCase(),
      "users",
      InsertData
    );
    if (response.status == 1) {
      swalMessgae("success", response.message);
      localStorage.setItem("username", username);
      localStorage.setItem("name", name);
      $(".result-container").hide();
      correct_answer_count = 0;
      await showScoreRecords("questions/" + category);
    } else {
      swalMessgae("error", response.message);
    }
  }
});

async function PrepareQuestion() {
  $(".question-text").text(
    question_no + 1 + ". " + filteredData[question_no].question
  );
  let options_content = "";
  filteredData[question_no].options.forEach((item, index) => {
    options_content +=
      '<div class="answer-option" option="' +
      (index + 1) +
      '">' +
      item +
      "</div>";
  });
  $(".answer-options").html(options_content);
  $(".question-status").text(
    question_no + 1 + " to " + filteredData.length + " Questions"
  );
  clearInterval(nextTime);
  currentTime = time_limit;
  startTimer("QuizTime");
  $(".quiz-content").show();
  $(".message_container").hide();
  $(".config-container").hide();
  $(".quiz-container").show();
  $("#username").val("");
  $("#name").val("");
}

// Prepare the swal message
function swalMessgae(icon, text, id = "") {
  swal.fire({
    icon: icon,
    text: text,
    allowOutsideClick: false,
    timer: 3000,
    didClose: function () {
      if (id != "") {
        $(id).focus();
      }
    },
  });
}

$(".message_container").hide();
$(document).on("click", ".answer-option", function (e) {
  let option = $(this).attr("option");
  $(".quiz-content").hide();
  $(".message_container").show();
  $(".message_container").find(".success_message").hide();
  $(".message_container").find(".wrong_message").hide();
  $(".message_container").find(".no_option_selected_message").hide();
  if (parseInt(option) == parseInt(filteredData[question_no].correct_answer)) {
    $(".message_container").find(".success_message").show();
    correct_answer_count++;
  } else {
    $(".message_container").find(".wrong_message").show();
    $(".answer-wrong-view").html(
      filteredData[question_no].options[option - 1] +
        '<span class="icon-set-end material-symbols-rounded"> cancel</span>'
    );
  }

  $(".answer-sccuess-view").html(
    filteredData[question_no].options[
      parseInt(filteredData[question_no].correct_answer) - 1
    ] +
      '<span class="icon-set-end material-symbols-rounded"> check_circle </span>'
  );
  clearInterval(timer);
  currentTime = 0;
  $(".timer-duration").text(`${currentTime}s`);
  NextcurrentTime = nextQuizTime;
  question_no++;
  startTimer();
});
// Clear and reset the timer
const resetTimer = () => {
  clearInterval(timer);
  currentTime = time_limit;
  $("#timer-duration").text(`${currentTime}s`);
};

// Initialize and start the timer for the current question
var nextQuizTime = 3,
  nextTime = null,
  NextcurrentTime = 0;
const startTimer = (type) => {
  if (question_no + 1 <= filteredData.length) {
    if (type == "QuizTime") {
      timer = setInterval(() => {
        $(".timer-duration").text(`${currentTime}s`);
        if (currentTime <= 0) {
          clearInterval(timer);
          $(".quiz-content").hide();
          $(".message_container").show();
          $(".message_container").find(".success_message").hide();
          $(".message_container").find(".wrong_message").hide();
          $(".message_container").find(".no_option_selected_message").show();
          $(".answer-sccuess-view").html(
            filteredData[question_no].options[
              parseInt(filteredData[question_no].correct_answer) - 1
            ] +
              '<span class="icon-set-end material-symbols-rounded"> check_circle </span>'
          );
          NextcurrentTime = nextQuizTime;
          question_no++;
          startTimer();
        } else {
          clearInterval(nextTime);
          $(".next-question-btn").hide();
          currentTime--;
        }
      }, 1000);
    } else {
      nextTime = setInterval(() => {
        $(".next-question-btn").text(`${NextcurrentTime}s`);
        if (NextcurrentTime <= 0) {
          $(".next-question-btn").hide();
          clearInterval(nextTime);
          PrepareQuestion();
        } else {
          $(".next-question-btn").show();
          NextcurrentTime--;
        }
      }, 1000);
    }
  } else {
    $(".config-container").hide();
    $(".quiz-container").hide();
    $("#username").val("");
    $(".result-message").text(
      "You scored " +
        correct_answer_count +
        " out of " +
        filteredData.length +
        ". Great effort!"
    );
    $("#certificate_name").text(localStorage.getItem("name"));
    $(".result-container").show();
  }
};

$("#downloadBtn").on("click", function () {
  html2canvas($(".certificate_container")[0]).then(function (canvas) {
    // Convert the canvas to a data URL
    const imageData = canvas.toDataURL("image/png");

    // Create a link element
    const link = $("<a></a>")
      .attr("href", imageData)
      .attr("download", localStorage.getItem("name") + " Certificate.png")
      .appendTo("body");

    // Programmatically click the link to trigger the download
    link[0].click();

    // Remove the link element after the download is triggered
    link.remove();

    setTimeout(function () {
      location.reload();
    }, 5000);
  });
});

// translate
function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    { pageLanguage: "en" },
    "google_translate_element"
  );
  $(".goog-te-combo").addClass("form-control");
  $(".goog-te-gadget")
    .contents()
    .filter(function () {
      return (
        this.nodeType === 3 ||
        (this.nodeType === 1 && !$(this).is("#\\:0\\.targetLanguage"))
      );
    })
    .remove();
}
googleTranslateElementInit();

$(document).on('click','#move_to_quiz_config',function (e) { 
  $(".config-container").show();
  $(".quiz-container").hide();
  $("#username").val("");
  $("#name").val("");
  NextcurrentTime=0;currentTime=0;question_no=0;
  clearInterval(nextTime);
  clearInterval(timer);
  localStorage.removeItem("username");
  localStorage.removeItem("name");
  localStorage.removeItem("category");
})