import React from 'react';

// --- Mock Data (Based on your image) ---
const myEquipment = [
  {
    id: 1,
    name: 'Industrial Lathe Machine',
    serial: 'LTH-2023-4578',
    location: 'Floor 2, Bay A',
    purchaseDate: 'Jan 15, 2023',
    warranty: 'Valid until Jan 2025',
    isWarrantyValid: true,
    historyCount: 3,
  },
  {
    id: 2,
    name: 'CNC Milling Machine',
    serial: 'CNC-2022-8921',
    location: 'Floor 3, Bay C',
    purchaseDate: 'Aug 22, 2022',
    warranty: 'Expired Aug 2024',
    isWarrantyValid: false,
    historyCount: 7,
  },
  {
    id: 3,
    name: 'Hydraulic Press',
    serial: 'HYD-2024-1142',
    location: 'Floor 1, Bay B',
    purchaseDate: 'Mar 10, 2024',
    warranty: 'Valid until Mar 2027',
    isWarrantyValid: true,
    historyCount: 1,
  },
];

const inMaintenance = [
  {
    id: 1,
    name: 'CNC Milling Machine',
    status: 'In Progress',
    statusColor: 'bg-amber-100 text-amber-800',
    subject: 'Spindle motor overheating',
    date: 'Dec 18, 2024',
  },
  {
    id: 2,
    name: 'Industrial Lathe Machine',
    status: 'Pending Parts',
    statusColor: 'bg-blue-100 text-blue-800',
    subject: 'Belt replacement needed',
    date: 'Dec 15, 2024',
  },
];

const scheduledMaintenance = [
  {
    id: 1,
    name: 'Hydraulic Press',
    type: 'Preventive Inspection',
    date: 'Jan 5, 2025',
    notes: 'Quarterly safety check',
  },
  {
    id: 2,
    name: 'CNC Milling Machine',
    type: 'Oil Change',
    date: 'Jan 12, 2025',
    notes: 'Regular lubrication service',
  },
  {
    id: 3,
    name: 'Industrial Lathe Machine',
    type: 'Calibration',
    date: 'Jan 20, 2025',
    notes: 'Annual precision calibration',
  },
];

const MaintenanceDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* --- Navbar --- */}
      <nav className="bg-white px-8 py-5 flex items-center gap-8 shadow-sm">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">MaintenanceHub</h1>
        <div className="flex gap-6 text-sm font-semibold text-slate-500">
          <a href="#" className="text-blue-600">Dashboard</a>
          <a href="#" className="hover:text-blue-600 transition-colors">My Equipment</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Maintenance Requests</a>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto p-8 space-y-10">

        {/* Section 1: My Assigned Equipment */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">My Assigned Equipment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEquipment.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-4">{item.name}</h3>
                
                {/* Details List */}
                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Serial Number:</span>
                    <span className="font-medium text-slate-700">{item.serial}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-medium text-slate-700">{item.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Purchase Date:</span>
                    <span className="font-medium text-slate-700">{item.purchaseDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Warranty:</span>
                    <span className={`font-medium ${item.isWarrantyValid ? 'text-green-600' : 'text-red-500'}`}>
                      {item.warranty}
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-auto space-y-3">
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded transition-colors shadow-sm">
                    Report Breakdown
                  </button>
                  <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded transition-colors flex items-center justify-center gap-2">
                    Maintenance History
                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.historyCount}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Equipments in Maintenance */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Equipments in Maintenance</h2>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-slate-50 px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
              <div className="col-span-4 md:col-span-3">Equipment Name</div>
              <div className="col-span-3 md:col-span-2">Status</div>
              <div className="col-span-5 md:col-span-5">Subject</div>
              <div className="hidden md:block col-span-2 text-right">Reported Date</div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-slate-100">
              {inMaintenance.map((item) => (
                <div key={item.id} className="grid grid-cols-12 px-6 py-4 items-center text-sm hover:bg-slate-50 transition-colors">
                  <div className="col-span-4 md:col-span-3 font-medium text-slate-800">{item.name}</div>
                  <div className="col-span-3 md:col-span-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="col-span-5 md:col-span-5 text-slate-600 truncate pr-4">{item.subject}</div>
                  <div className="hidden md:block col-span-2 text-right text-slate-500">{item.date}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Scheduled Maintenance */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Scheduled Maintenance by Manager</h2>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-slate-50 px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
              <div className="col-span-3">Equipment Name</div>
              <div className="col-span-3">Maintenance Type</div>
              <div className="col-span-2">Scheduled Date</div>
              <div className="col-span-4 text-right">Notes</div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-slate-100">
              {scheduledMaintenance.map((item) => (
                <div key={item.id} className="grid grid-cols-12 px-6 py-4 items-center text-sm hover:bg-slate-50 transition-colors">
                  <div className="col-span-3 font-medium text-slate-800">{item.name}</div>
                  <div className="col-span-3 text-slate-600">{item.type}</div>
                  <div className="col-span-2 font-bold text-slate-800">{item.date}</div>
                  <div className="col-span-4 text-right text-slate-500">{item.notes}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default MaintenanceDashboard;