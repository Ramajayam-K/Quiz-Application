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
  time_limit = 15;

var filteredData = {};
$(".quiz-container,.finish_quiz").hide();

async function showScoreRecords(table) {
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
  const usersRef = ref(database, table);
  const userKeyRef = child(usersRef, key);
  try {
    const snapshot = await get(userKeyRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();
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
}

async function insertDataByKey(key, table, InsertData = {}) {
  getDataByKey(key, table)
    .then((userData) => {
      console.log(userData);
      if (userData == undefined || userData == null || userData == "") {
        set(ref(database, table + "/" + key), InsertData)
          .then(() => {
            console.log(table + "/" + key);
            console.log(InsertData);
            return { status: 1, message: "Data inserted successfully" };
          })
          .catch((error) => {
            return { status: 0, message: "Data is not inserted." };
          });
      } else {
        return { status: 0, message: "Data already exists for the given key." };
      }
    })
    .catch((error) => {
      return { status: 0, message: "Data is not able to retrieving." };
    });
}

$(document).on("click", "#start_quiz", async function (e) {
  let username = $("#username").val().trim();
  let name = $("#name").val().trim();
  if (username == "") {
    swalMessgae("error", "Please enter the username.", "#username");
  } else if (name == "") {
    swalMessgae("error", "Please enter the your name.", "#name");
  } else {
    let InsertData = { username, name };
    insertDataByKey(username.toLowerCase(), "users", InsertData);
    $(".config-container").hide();
    $(".quiz-container").show();
    $("#username").val("");
    $("#name").val("");
    await showScoreRecords("questions/pongal");
  }
});

async function PrepareQuestion() {
  console.log(question_no, filteredData[question_no]);
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
}

// Prepare the swal message
function swalMessgae(icon, text, id = "") {
  swal.fire({
    icon: icon,
    text: text,
    allowOutsideClick: false,
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
          clearInterval(nextTime);
          PrepareQuestion();
        } else {
          NextcurrentTime--;
        }
      }, 1000);
      $(".next-question-btn").show();
    }
  } else {
    $(".finish_quiz").show();
  }
};

// DOM element selectors
const configContainer = document.querySelector(".config-container");
const quizContainer = document.querySelector(".quiz-container");
const answerOptions = quizContainer.querySelector(".answer-options");
const nextQuestionBtn = quizContainer.querySelector(".next-question-btn");
const questionStatus = quizContainer.querySelector(".question-status");
const timerDisplay = quizContainer.querySelector(".timer-duration");
const resultContainer = document.querySelector(".result-container");
// Quiz state variables
const QUIZ_TIME_LIMIT = 15;
let currentTime = QUIZ_TIME_LIMIT;
let timer = null;
let quizCategory = "programming";
let numberOfQuestions = 3;
let currentQuestion = null;
const questionsIndexHistory = [];
let correctAnswersCount = 0;
let disableSelection = false;
// Display the quiz result and hide the quiz container
const showQuizResult = () => {
  clearInterval(timer);
  resultContainer.style.display = "block";
  quizContainer.style.display = "none";
  const resultText = `You answered <b>${correctAnswersCount}</b> out of <b>${numberOfQuestions}</b> questions correctly. Great effort!`;
  resultContainer.querySelector(".result-message").innerHTML = resultText;
};

// Fetch a random question from based on the selected category
const getRandomQuestion = () => {
  const categoryQuestions =
    questions.find(
      (cat) => cat.category.toLowerCase() === quizCategory.toLowerCase()
    )?.questions || [];
  // Show the results if all questions have been used
  if (
    questionsIndexHistory.length >=
    Math.min(numberOfQuestions, categoryQuestions.length)
  ) {
    return showQuizResult();
  }
  // Filter out already asked questions and choose a random one
  const availableQuestions = categoryQuestions.filter(
    (_, index) => !questionsIndexHistory.includes(index)
  );
  const randomQuestion =
    availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  questionsIndexHistory.push(categoryQuestions.indexOf(randomQuestion));
  return randomQuestion;
};
// Highlight the correct answer option and add icon
const highlightCorrectAnswer = () => {
  const correctOption =
    answerOptions.querySelectorAll(".answer-option")[
      currentQuestion.correctAnswer
    ];
  correctOption.classList.add("correct");
  const iconHTML = `<span class="material-symbols-rounded"> check_circle </span>`;
  correctOption.insertAdjacentHTML("beforeend", iconHTML);
};
// Handle the user's answer selection
const handleAnswer = (option, answerIndex) => {
  if (disableSelection) return;
  clearInterval(timer);
  disableSelection = true;
  const isCorrect = currentQuestion.correctAnswer === answerIndex;
  option.classList.add(isCorrect ? "correct" : "incorrect");
  !isCorrect ? highlightCorrectAnswer() : correctAnswersCount++;
  // Insert icon based on correctness
  const iconHTML = `<span class="material-symbols-rounded"> ${
    isCorrect ? "check_circle" : "cancel"
  } </span>`;
  option.insertAdjacentHTML("beforeend", iconHTML);
  // Disable all answer options after one option is selected
  answerOptions
    .querySelectorAll(".answer-option")
    .forEach((option) => (option.style.pointerEvents = "none"));
  nextQuestionBtn.style.visibility = "visible";
};
// Render the current question and its options in the quiz
const renderQuestion = () => {
  currentQuestion = getRandomQuestion();
  if (!currentQuestion) return;
  disableSelection = false;
  resetTimer();
  startTimer();
  // Update the UI
  nextQuestionBtn.style.visibility = "hidden";
  quizContainer.querySelector(".quiz-timer").style.background = "#32313C";
  quizContainer.querySelector(".question-text").textContent =
    currentQuestion.question;
  questionStatus.innerHTML = `<b>${questionsIndexHistory.length}</b> of <b>${numberOfQuestions}</b> Questions`;
  answerOptions.innerHTML = "";
  // Create option <li> elements, append them, and add click event listeners
  currentQuestion.options.forEach((option, index) => {
    const li = document.createElement("li");
    li.classList.add("answer-option");
    li.textContent = option;
    answerOptions.append(li);
    li.addEventListener("click", () => handleAnswer(li, index));
  });
};
// Start the quiz and render the random question
const startQuiz = () => {
  configContainer.style.display = "none";
  quizContainer.style.display = "block";
  // Update the quiz category and number of questions
  quizCategory = configContainer.querySelector(
    ".category-option.active"
  ).textContent;
  numberOfQuestions = parseInt(
    configContainer.querySelector(".question-option.active").textContent
  );
  renderQuestion();
};
// Highlight the selected option on click - category or no. of question
configContainer
  .querySelectorAll(".category-option, .question-option")
  .forEach((option) => {
    option.addEventListener("click", () => {
      option.parentNode.querySelector(".active").classList.remove("active");
      option.classList.add("active");
    });
  });
// Reset the quiz and return to the configuration container
const resetQuiz = () => {
  resetTimer();
  correctAnswersCount = 0;
  questionsIndexHistory.length = 0;
  configContainer.style.display = "block";
  resultContainer.style.display = "none";
};
// Event listeners
nextQuestionBtn.addEventListener("click", renderQuestion);
resultContainer
  .querySelector(".try-again-btn")
  .addEventListener("click", resetQuiz);
// configContainer
//   .querySelector(".start-quiz-btn")
//   .addEventListener("click", startQuiz);
