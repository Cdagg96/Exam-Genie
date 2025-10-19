import NavBar from "@/components/navbar";

export default function DatabaseActionPage() {
    return (
        <div className="flex flex-col justify-between min-h-screen p-8 text-center bg-gradient-to-b from-[#EFF6FF] to-white">
            <header>
                <NavBar />
            </header>
            <main className="flex flex-col items-center justify-center pt-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Question Bank
                </h1>
                <p className="text-gray-600 mb-8 text-lg max-w-2xl">
                    Manage and view all questions in the database. Filter by topic, difficulty, or type to find specific questions.
                </p>

                {/* Filtering Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 w-full border border-gray-100">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-left">
                        Filter Questions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Topic Filter */}
                        <div className="text-left">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Topic
                            </label>
                            <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                                <option value="">All Topics</option>
                                <option value="Topic1">Topic 1</option>
                                <option value="Topic2">Topic 2</option>
                                <option value="Topic3">Topic 3</option>
                                <option value="Topic4">Topic 5</option>
                            </select>
                        </div>

                        {/* Difficulty Filter */}
                        <div className="text-left">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Difficulty
                            </label>
                            <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                                <option value="">All Difficulties</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div className="text-left">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type
                            </label>
                            <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                                <option value="">All Types</option>
                                <option value="Multiple Choice">Multiple Choice</option>
                                <option value="Essay">Essay</option>
                                <option value="FIB">Fill In The Blank</option>
                                <option value="True/False">True/False</option>
                                <option value="Coding">Coding</option>
                            </select>
                        </div>
                    </div>

                    {/* Last Used Filter */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-md">
                        <div className="text-left">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Used
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Ex: 01/01/2025"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Zm-.001 4.5h.006v.006h-.006v-.005Zm-2.25.001h.005v.006H9.75v-.006Zm-2.25 0h.005v.005h-.006v-.005Zm6.75-2.247h.005v.005h-.005v-.005Zm0 2.247h.006v.006h-.006v-.006Zm2.25-2.248h.006V15H16.5v-.005Z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex justify-end space-x-4 mt-8">
                        <button className="px-6 py-3 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-900 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5">
                            Clear Filters
                        </button>
                        <button className="px-6 py-3 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-900 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5">
                            Apply Filters
                        </button>
                    </div>
                </div>

                {/* Empty Questions Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                        Question
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                        Difficulty
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                        Topic
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                        Choices
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                        Last Used
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>

                                {/* Empty table body */}
                                <tr>
                                    <td colSpan={8} className="px-6 py-24 text-center">
                                        <div className="text-gray-400 text-lg">No questions found</div>
                                        <div className="text-gray-400 text-sm mt-2">Add a question to get started</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Question Button */}
                <div className="mt-12 flex justify-center">
                    <button className="px-12 py-5 bg-gray-800 text-white text-xl font-bold rounded-2xl hover:bg-gray-900 transition-all duration-300 shadow-2xl transform hover:-translate-y-1 hover:shadow-3xl flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        Add New Question to Database
                    </button>
                </div>
            </main>
        </div>
    );
}