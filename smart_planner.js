let courses = [];

window.onload = async () => {
  document.cookie = "lastVisited=" + window.location.pathname + "; path=/";
  console.log(document.cookie);

  const res = await fetch('courses.json');
  courses = await res.json();

  const container = document.getElementById('course-checkboxes');
  courses.forEach(course => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = "checkbox";
    input.value = course.code;
    label.appendChild(input);
    label.appendChild(document.createTextNode(` ${course.code}: ${course.name}`));
    container.appendChild(label);
    container.appendChild(document.createElement('br'));
  });

  const savedSem = localStorage.getItem('gradSemester');
  const savedYear = localStorage.getItem('gradYear');
  const savedCompleted = JSON.parse(localStorage.getItem('completedCourses') || "[]");

  if (savedSem && savedYear) {
    document.getElementById('grad-semester').value = savedSem;
    document.getElementById('grad-year').value = savedYear;

    savedCompleted.forEach(code => {
      const input = document.querySelector(`#course-checkboxes input[value="${code}"]`);
      if (input) input.checked = true;
    });

    const completedSet = new Set(savedCompleted);
    const plan = generatePlan(completedSet, savedSem, parseInt(savedYear));
    renderPlan(plan);
  }

  document.getElementById('generate-btn').addEventListener('click', () => {
    const gradSemester = document.getElementById('grad-semester').value;
    const gradYear = parseInt(document.getElementById('grad-year').value);
    const checkedBoxes = Array.from(document.querySelectorAll('#course-checkboxes input:checked'));
    const completed = new Set(checkedBoxes.map(c => c.value));

    const plan = generatePlan(completed, gradSemester, gradYear);
    renderPlan(plan);
  });

  document.getElementById('clear-smart').addEventListener('click', () => {
    localStorage.removeItem('gradSemester');
    localStorage.removeItem('gradYear');
    localStorage.removeItem('completedCourses');

    document.querySelectorAll('#course-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('grad-semester').value = '';
    document.getElementById('grad-year').value = '';
    document.getElementById('semesters').innerHTML = '';
    document.getElementById('message').textContent = '';
  });
};

function getCurrentSemester() {
  const today = new Date();
  const year = today.getFullYear();

  const springStart = new Date(year, 0, 13);
  const springEnd = new Date(year, 4, 30);
  const fallStart = new Date(year, 7, 15);
  const fallEnd = new Date(year, 11, 20);

  if (today >= springStart && today <= springEnd) {
    return { semester: 'Spring', year };
  } else if (today >= fallStart && today <= fallEnd) {
    return { semester: 'Fall', year };
  } else if (today < springStart) {
    return { semester: 'Fall', year: year - 1 };
  } else {
    return { semester: 'Spring', year: year + 1 };
  }
}

function generateRemainingSemesters(current, graduation) {
  const semesters = [];
  const order = ['Spring', 'Fall'];
  let currSem = current.semester;
  let currYear = current.year;

  if (currSem === 'Spring') {
    currSem = 'Fall';
  } else {
    currSem = 'Spring';
    currYear += 1;
  }

  while (
    currYear < graduation.year ||
    (currYear === graduation.year &&
      order.indexOf(currSem) <= order.indexOf(graduation.semester))
  ) {
    semesters.push({ semester: currSem, year: currYear });

    if (currSem === 'Spring') {
      currSem = 'Fall';
    } else {
      currSem = 'Spring';
      currYear += 1;
    }
  }

  return semesters;
}

function generatePlan(completed, gradSemester, gradYear) {
  const message = document.getElementById('message');
  message.textContent = "";

  const current = getCurrentSemester();
  const graduation = { semester: gradSemester, year: gradYear };

  localStorage.setItem('gradSemester', gradSemester);
  localStorage.setItem('gradYear', gradYear);
  localStorage.setItem('completedCourses', JSON.stringify([...completed]));

  if (
    graduation.year < current.year ||
    (graduation.year === current.year &&
      ['Spring', 'Fall'].indexOf(graduation.semester) <= ['Spring', 'Fall'].indexOf(current.semester))
  ) {
    message.textContent = "Please select a graduation semester in the future.";
    return [];
  }

  const semesters = generateRemainingSemesters(current, graduation);
  const remaining = courses.filter(c => !completed.has(c.code));
  const scheduled = new Set([...completed]);

  for (let sem of semesters) {
    let count = 0;
    for (let course of remaining) {
      if (
        !scheduled.has(course.code) &&
        course.offering.some(o =>
          o.semester === sem.semester &&
          (o.yearType === "both" ||
            (o.yearType === "even" && sem.year % 2 === 0) ||
            (o.yearType === "odd" && sem.year % 2 === 1))
        )
      ) {
        sem.courses = sem.courses || [];
        sem.courses.push(course);
        scheduled.add(course.code);
        count++;
        if (count >= 4) break;
      }
    }
  }

  const unscheduled = remaining.filter(c => !scheduled.has(c.code));
  if (unscheduled.length > 0) {
    message.innerHTML = `Not all courses could be scheduled before graduation.<br>Talk to your advisor about summer classes or substitutions!`;
  }

  return semesters;
}

function renderPlan(semesters) {
  const container = document.getElementById('semesters');
  container.innerHTML = `<h2>Your Auto-Filled Semesters</h2>`;

  semesters.forEach(sem => {
    const box = document.createElement('div');
    box.className = 'semester';
    box.innerHTML = `<h3>${sem.semester} ${sem.year}</h3>`;

    const courseContainer = document.createElement('div');
    courseContainer.className = 'course-container';

    (sem.courses || []).forEach(c => {
      const courseDiv = document.createElement('div');
      courseDiv.className = 'course';
      courseDiv.textContent = `${c.code}: ${c.name}`;
      courseContainer.appendChild(courseDiv);
    });

    const creditDiv = document.createElement('div');
    const totalCredits = (sem.courses || []).reduce((sum, c) => sum + c.credits, 0);
    creditDiv.className = 'credit-total';
    creditDiv.textContent = `Total Credits: ${totalCredits}`;

    box.appendChild(courseContainer);
    box.appendChild(creditDiv);
    container.appendChild(box);
  });

}


