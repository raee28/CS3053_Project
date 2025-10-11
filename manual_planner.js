async function loadCourses() {
  const res = await fetch('courses.json');
  const courses = await res.json();

  const courseList = document.getElementById('courses');
  courseList.innerHTML = '';

  courses.forEach(course => {
    const div = document.createElement('div');
    div.className = 'course';
    div.draggable = true;
    div.textContent = `${course.code}: ${course.name}`;
    div.dataset.code = course.code;
    div.dataset.credits = course.credits;
    div.addEventListener('dragstart', dragStart);
    courseList.appendChild(div);
  });
}
function dragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.dataset.code);
}

function dragOver(e) {
  e.preventDefault();
}

function drop(e) {
  e.preventDefault();
  const code = e.dataTransfer.getData('text/plain');
  const draggedCourse = document.querySelector(`.course[data-code="${code}"]`);

  if (draggedCourse) {
    const container = e.target.classList.contains('course-container')
      ? e.target
      : e.target.querySelector('.course-container');

    if (container) {
      container.appendChild(draggedCourse);
      savePlan();
      updateCredits();
    }
  }
}

function updateCredits() {
  document.querySelectorAll('.semester').forEach(sem => {
    const courses = sem.querySelectorAll('.course');
    let total = 0;
    courses.forEach(c => {
      total += parseInt(c.dataset.credits || "0");
    });
    sem.querySelector('.credit-total').textContent = `Total Credits: ${total}`;
  });
}

function savePlan() {
  const plan = {};
  document.querySelectorAll('.semester').forEach(sem => {
    const name = sem.dataset.semester;
    const courses = Array.from(sem.querySelectorAll('.course')).map(c => c.dataset.code);
    plan[name] = courses;
  });

  localStorage.setItem('csDegreePlan', JSON.stringify(plan));

  fetch('/api/save-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan)
  }).catch(() => { });
}

function loadPlan() {
  const saved = localStorage.getItem('csDegreePlan');
  if (!saved) return;

  const plan = JSON.parse(saved);
  for (const semester in plan) {
    const container = document.querySelector(`.semester[data-semester="${semester}"] .course-container`);
    plan[semester].forEach(code => {
      const course = document.querySelector(`.course[data-code="${code}"]`);
      if (course) container.appendChild(course);
    });
  }

  updateCredits();
}

function clearPlan() {
  const courseList = document.getElementById('courses');

  document.querySelectorAll('.course-container .course').forEach(course => {
    courseList.appendChild(course);
  });

  document.querySelectorAll('.credit-total').forEach(div => {
    div.textContent = 'Total Credits: 0';
  });

  localStorage.removeItem('csDegreePlan');
}

function setupImageModal() {
  const modal = document.getElementById('image-modal');
  const thumb = document.getElementById('sequence-img');

  if (modal && thumb) {
    thumb.addEventListener('click', () => {
      modal.style.display = 'flex';
    });

    modal.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadCourses().then(loadPlan);
  setupImageModal();

  document.getElementById('clear-button').addEventListener('click', clearPlan);

  document.querySelectorAll('.semester').forEach(sem => {
    sem.addEventListener('dragover', dragOver);
    sem.addEventListener('drop', drop);
  });
});