export function Dashboard() {
  // Sample triage status
  const triageStatus = {
    status: "good" as const,
    description: "Vital signs within normal range",
  };

  // Sample symptoms data
  const recordedSymptoms = [
    "Mild headache",
    "Fatigue",
    "Body ache",
  ];

  // Sample guidance cards
  const guidanceCards = [
    {
      id: 1,
      title: "Stay Hydrated",
      description: "Drink plenty of water throughout the day to support your immune system.",
    },
    {
      id: 2,
      title: "Rest Well",
      description: "Ensure you get 7-8 hours of quality sleep for optimal recovery.",
    },
    {
      id: 3,
      title: "Monitor Symptoms",
      description: "Keep track of any changes in your condition and report them.",
    },
    {
      id: 4,
      title: "Maintain Nutrition",
      description: "Eat balanced meals with plenty of fruits and vegetables.",
    },
  ];

  const getTriageColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-emerald-50 border-emerald-200";
      case "good":
        return "bg-amber-50 border-amber-200";
      case "bad":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="flex h-screen bg-[#F9FBFC] overflow-hidden">
      {/* Left Section - Empty/Reserved */}
      <div className="w-0 hidden lg:w-1/6 bg-white border-r border-gray-100"></div>

      {/* Middle Section - Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto lg:w-4/6">
        <div className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
          {/* Header Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-normal text-gray-900">
              Dashboard
            </h1>
          </div>

          {/* Disclaimer Section */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 md:p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              This dashboard provides clinical decision support and health insights based on your recorded information. It is not a diagnostic tool and should not be used as a substitute for professional medical advice. Always consult with a healthcare provider for accurate diagnosis and treatment recommendations.
            </p>
          </div>

          {/* Main Information Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Sub-section: Triage Details */}
            <div className={`rounded-lg border p-6 md:p-8 ${getTriageColor(triageStatus.status)}`}>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Triage Status
              </h2>
              
              <div className="space-y-4">
                {/* Excellent Indicator */}
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-gray-700">Excellent</span>
                </div>

                {/* Good Indicator */}
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${triageStatus.status === "good" ? "bg-amber-500" : "bg-gray-300"}`}></div>
                  <span className={`text-sm ${triageStatus.status === "good" ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                    Good
                  </span>
                </div>

                {/* Bad Indicator */}
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-700">Bad</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-current border-opacity-10">
                <p className="text-sm text-gray-700">
                  {triageStatus.description}
                </p>
              </div>
            </div>

            {/* Right Sub-section: Recorded Symptoms */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Recorded Symptoms
              </h2>

              {recordedSymptoms.length > 0 ? (
                <div className="space-y-3">
                  {recordedSymptoms.map((symptom, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{symptom}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">
                    No symptoms recorded yet. Start a chat to record your symptoms.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Guidance Cards */}
      <div className="w-0 hidden xl:w-1/6 overflow-y-auto bg-white border-l border-gray-100">
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 px-2">
            Guidance & Suggestions
          </h3>

          {guidanceCards.map((card) => (
            <div
              key={card.id}
              className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
            >
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                {card.title}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
