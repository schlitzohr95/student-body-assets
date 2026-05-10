import type { AcademicTestDefinition } from "../types/game";

export const ACADEMIC_TESTS: AcademicTestDefinition[] = [
  {
    id: "soc101_diagnostic",
    courseId: "soc101",
    courseTitle: "Intro Sociology",
    label: "Diagnostic Quiz",
    day: 7,
    location: "lecture_hall",
    baseDifficulty: 6,
    questions: [
      {
        id: "norms_vs_laws",
        prompt: "A student cuts through the dining hall line. Nobody calls campus security, but everyone nearby reacts. Which concept best explains what was violated?",
        hint: "The reaction is social before it is formal.",
        skill: "knowledge",
        options: [
          { id: "law", label: "A formal law" },
          { id: "norm", label: "An informal norm", correct: true },
          { id: "sanction", label: "A legal sanction" },
          { id: "sample", label: "A representative sample" }
        ],
        explanation: "Norms are shared expectations. They can be enforced socially even when no formal rule is invoked."
      },
      {
        id: "operationalize",
        prompt: "Dr. Hale asks the class to turn 'campus belonging' into something observable. What is she asking students to do?",
        hint: "She wants a fuzzy idea turned into measurable evidence.",
        skill: "knowledge",
        options: [
          { id: "operationalize", label: "Operationalize the concept", correct: true },
          { id: "generalize", label: "Generalize from a sample" },
          { id: "sanction", label: "Apply a sanction" },
          { id: "stratify", label: "Stratify the population" }
        ],
        explanation: "Operationalizing means defining how an abstract concept will be observed or measured."
      },
      {
        id: "correlation",
        prompt: "A survey finds students who attend club meetings report higher belonging. What is the safest claim?",
        hint: "Do not overclaim cause from a relationship.",
        skill: "grit",
        options: [
          { id: "cause", label: "Clubs definitely cause belonging" },
          { id: "reverse", label: "Belonging definitely causes club attendance" },
          { id: "association", label: "Club attendance is associated with belonging", correct: true },
          { id: "invalid", label: "The survey proves nothing can be learned" }
        ],
        explanation: "A correlation supports an association, but causation needs stronger design or evidence."
      },
      {
        id: "ethnography",
        prompt: "A researcher spends evenings in the student union taking field notes about how groups form and split. Which method is this closest to?",
        hint: "Think observation in a natural setting.",
        skill: "sensitivity",
        options: [
          { id: "experiment", label: "Laboratory experiment" },
          { id: "ethnography", label: "Ethnographic observation", correct: true },
          { id: "census", label: "Census enumeration" },
          { id: "regression", label: "Regression modeling" }
        ],
        explanation: "Ethnography uses close observation and field notes to understand social life in context."
      }
    ]
  },
  {
    id: "soc101_methods_midterm",
    courseId: "soc101",
    courseTitle: "Intro Sociology",
    label: "Methods Midterm",
    day: 14,
    location: "lecture_hall",
    baseDifficulty: 8,
    questions: [
      {
        id: "sampling_bias",
        prompt: "A campus survey only includes students who already visit the library. What is the strongest concern?",
        hint: "Who is missing from the data?",
        skill: "knowledge",
        options: [
          { id: "bias", label: "Sampling bias", correct: true },
          { id: "ethics", label: "Informed consent is impossible" },
          { id: "causal", label: "Too many causal variables" },
          { id: "none", label: "There is no concern" }
        ],
        explanation: "Sampling only library visitors likely excludes students with different habits and experiences."
      },
      {
        id: "confidentiality",
        prompt: "A student interview includes sensitive family details. What should the researcher prioritize when writing field notes?",
        hint: "Protect the person, not just the data file.",
        skill: "sensitivity",
        options: [
          { id: "names", label: "Use full names so the data is vivid" },
          { id: "confidentiality", label: "Protect confidentiality", correct: true },
          { id: "publish", label: "Post the details for peer review" },
          { id: "ignore", label: "Ignore it because it is qualitative" }
        ],
        explanation: "Sensitive qualitative data still requires confidentiality and careful handling."
      },
      {
        id: "variable",
        prompt: "In a study of sleep and test performance, 'hours slept' is being used as what?",
        hint: "It is the measured factor that may vary.",
        skill: "knowledge",
        options: [
          { id: "variable", label: "A variable", correct: true },
          { id: "norm", label: "A norm" },
          { id: "sanction", label: "A sanction" },
          { id: "ethic", label: "An ethical review" }
        ],
        explanation: "A variable is something measured that can take different values."
      }
    ]
  }
];

export const DEFAULT_COURSE_ID = "soc101";
