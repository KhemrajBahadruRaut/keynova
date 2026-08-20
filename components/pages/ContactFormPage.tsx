"use client";
import React, { useState } from "react";

const ContactFormPage: React.FC = () => {
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Wire this up to your form handler / API endpoint
  };

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 sm:grid-cols-2 sm:items-start">
      {/* Replace the src below with your own image */}
      <div className="justify-center md:justify-end flex ">
        <img
          src="/letstalk/image.png"
          alt="Agent portrait"
          className="rounded-lg h-70 sm:h-126 object-contain"
        />
      </div>

      <div className="">
        <h1 className="text-2xl font-bold text-[#0F3D5C]">Let&apos;s Talk</h1>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8">
            <input
              type="text"
              placeholder="First Name"
              className="border-b border-slate-300 pb-2 text-sm text-slate-700 placeholder:text-slate-500 focus:border-[#0F3D5C] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Last Name"
              className="border-b border-slate-300 pb-2 text-sm text-slate-700 placeholder:text-slate-500 focus:border-[#0F3D5C] focus:outline-none"
            />
          </div>

          <input
            type="email"
            placeholder="Email"
            className="border-b border-slate-300 pb-2 text-sm text-slate-700 placeholder:text-slate-500 focus:border-[#0F3D5C] focus:outline-none"
          />

          <input
            type="text"
            placeholder="Subject"
            className="border-b border-slate-300 pb-2 text-sm text-slate-700 placeholder:text-slate-500 focus:border-[#0F3D5C] focus:outline-none"
          />

          <textarea
            placeholder="Type your message here ..."
            rows={3}
            className="resize-none border-b border-slate-300 pb-2 text-sm text-slate-700 placeholder:text-slate-500 focus:border-[#0F3D5C] focus:outline-none"
          />

          <input
            type="tel"
            placeholder="Phone"
            className="border-b border-slate-300 pb-2 text-sm text-slate-700 placeholder:text-slate-500 focus:border-[#0F3D5C] focus:outline-none"
          />

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#0F3D5C]"
            />
            I agree to the terms &amp; conditions below
          </label>

          <p className="text-xs leading-relaxed text-slate-500">
            I agree to be contacted by KeyNova Group via call, email, and text
            for real estate services. To opt out, you can reply &apos;stop&apos;
            at any time or reply &apos;help&apos; for assistance. You can also
            click the unsubscribe link in the emails. Message and data rates may
            apply. Message frequency may vary.{" "}
            <a href="/privacy-policy" className="underline">
              Privacy Policy
            </a>
          </p>

          <button
            type="submit"
            className="mt-1 w-fit rounded-full border border-[#0F3D5C] px-8 py-2.5 text-sm font-semibold text-[#0F3D5C] transition-colors hover:bg-[#0F3D5C] hover:text-white"
          >
            Submit
          </button>
        </form>
      </div>
    </section>
  );
};

export default ContactFormPage;
