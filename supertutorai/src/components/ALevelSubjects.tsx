import React from "react";

interface ALevelSubjectsProps {
  onSelectSubject: (subject: string) => void;
}

const ALevelSubjects: React.FC<ALevelSubjectsProps> = ({ onSelectSubject }) => {
  const subjects = [
    {
      name: "Mathematics",
      icon: "📐",
      description: "Pure Mathematics, Statistics, Mechanics",
    },
    {
      name: "Further Mathematics",
      icon: "🧮",
      description: "Advanced Pure, Statistics, Mechanics, Decision",
    },
    {
      name: "Physics",
      icon: "⚛️",
      description: "Mechanics, Electricity, Waves, Nuclear Physics",
    },
    {
      name: "Chemistry",
      icon: "🧪",
      description: "Organic, Inorganic, Physical Chemistry",
    },
    {
      name: "Biology",
      icon: "🧬",
      description: "Cells, Genetics, Ecology, Physiology",
    },
    {
      name: "Economics",
      icon: "📊",
      description: "Micro, Macro, International Economics",
    },
    {
      name: "Computer Science",
      icon: "💻",
      description: "Programming, Algorithms, Data Structures",
    },
    {
      name: "Other Subjects",
      icon: "📚",
      description: "Geography, History, Psychology, etc.",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-2">
      {subjects.map((subject) => (
        <div
          key={subject.name}
          className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
          onClick={() => onSelectSubject(subject.name)}
        >
          <div className="flex items-center">
            <div className="text-2xl mr-3">{subject.icon}</div>
            <div>
              <h3 className="font-medium text-gray-800">{subject.name}</h3>
              <p className="text-xs text-gray-500">{subject.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ALevelSubjects;
