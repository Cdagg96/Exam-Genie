"use client";

import { useState, useEffect, useRef } from "react";
import NavBar from "@/components/navbar";
import FilterBox from "@/components/filterBox";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthContext";
import { Background } from "@/components/BackgroundModal";
import MemberCard from "@/components/MemberCard";

export default function CooperatePage() {
    return (
        <Background>
            <div className="flex flex-col min-h-screen p-4">

                <NavBar />

                <main className="pt-8">
                    <h1 className="text-4xl mb-4 text-blue-gradient">
                        Cooperate With Faculty
                    </h1>
                    <p className="text-secondary mb-8 text-lg max-w-2xl mx-auto text-center">
                        Connect with other instructors to share questions, collaborate on exams,
                        and build shared resources.
                    </p>

                    {/* Filters */}
                    <div className="card-primary p-6 mb-8">
                        <h2 className="text-2xl text-primary mb-6">
                        Find Faculty
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <FilterBox
                            options={[]}
                            label="Name"
                            placeholder="Search by name"
                            onSelect={() => {}}
                            value=""
                            maxLength={50}
                        />

                        <FilterBox
                            options={[]}
                            label="Institution"
                            placeholder="Search by institution"
                            onSelect={() => {}}
                            value=""
                            maxLength={50}
                        />

                        <FilterBox
                            options={[]}
                            label="Subject"
                            placeholder="Search by subject"
                            onSelect={() => {}}
                            value=""
                            maxLength={50}
                        />

                        <FilterBox
                            options={[]}
                            label="Department"
                            placeholder="Search by department"
                            onSelect={() => {}}
                            value=""
                            maxLength={50}
                        />

                        </div>
                        {/* Filter Actions */}
                        <div className="flex justify-end space-x-4 mt-8">
                            <button className="px-6 py-3 btn btn-ghost">
                                Clear Filters
                            </button>
                            <button className="px-6 py-3 btn btn-primary-blue">
                                Apply Filters
                            </button>
                        </div>
                    </div>

                    {/* Member Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <MemberCard
                            name={"Test Card"}
                            school={"Ohio University"}
                            subjects={["CS2401"]}
                            department={"Computer Science"}
                        />
                        <MemberCard
                            name={"Test Card"}
                            school={"Ohio University"}
                            subjects={["CS2401"]}
                            department={"Computer Science"}
                        />
                        <MemberCard
                            name={"Test Card"}
                            school={"Ohio University"}
                            subjects={["CS2401"]}
                            department={"Computer Science"}
                        />
                        <MemberCard
                            name={"Test Card"}
                            school={"Ohio University"}
                            subjects={["CS2401"]}
                            department={"Computer Science"}
                        />
                        <MemberCard
                            name={"Test Card"}
                            school={"Ohio University"}
                            subjects={["CS2401"]}
                            department={"Computer Science"}
                        />
                        <MemberCard
                            name={"Test Card"}
                            school={"Ohio University"}
                            subjects={["CS2401"]}
                            department={"Computer Science"}
                        />
                        <MemberCard
                            name={"Test Card"}
                            school={"Ohio University"}
                            subjects={["CS2401"]}
                            department={"Computer Science"}
                        />
                        <MemberCard
                            name={"Test Card"}
                            school={"Ohio University"}
                            subjects={["CS2401"]}
                            department={"Computer Science"}
                        />
                    </div>
                </main>
            </div>
        </Background>
    );
}