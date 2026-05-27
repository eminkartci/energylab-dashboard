import { PROJECT, TEAM_MEMBERS, TUTORS } from '../data/credits'

function PersonCard({ name }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-[#0f2444]/10 text-[#0f2444] flex items-center justify-center text-sm font-semibold flex-shrink-0">
        {name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('')}
      </div>
      <p className="text-sm font-medium text-slate-800 leading-snug">{name}</p>
    </div>
  )
}

export default function Credits() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-stretch">
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-5 bg-[#1b4332] text-white">
            <p className="text-[11px] uppercase tracking-widest text-emerald-200/90 font-semibold">
              {PROJECT.group}
            </p>
            <h2 className="text-xl font-bold leading-snug mt-2">{PROJECT.title}</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              This interactive financial model was developed as part of the Energy Management Lab
              at Politecnico di Milano, in collaboration with NativeStrategy.
            </p>
            <div className="flex flex-wrap gap-3">
              {PROJECT.institutions.map(org => (
                <div
                  key={org.name}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <p className="text-sm font-semibold text-slate-800">{org.name}</p>
                  <p className="text-[11px] text-slate-500">{org.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white min-h-[220px]">
          <img
            src="/project-cover.png"
            alt="Renewable energy site with PV, BESS, and wind turbines"
            className="w-full h-full object-cover object-right"
          />
        </div>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Project team</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {TEAM_MEMBERS.map(name => (
            <PersonCard key={name} name={name} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Tutors</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
          {TUTORS.map(tutor => (
            <div key={tutor.role} className="rounded-xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{tutor.role}</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{tutor.name}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
