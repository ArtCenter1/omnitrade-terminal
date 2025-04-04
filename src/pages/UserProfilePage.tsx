import React, { useState } from 'react';

const UserProfilePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('User Profile');
  // Static data based on the image description
  const activityLog = [
    { activity: 'Logged in', dateTime: '2025-04-04 10:00 AM', ip: '192.168.1.1', location: 'New York, USA' },
    { activity: 'Updated profile', dateTime: '2025-04-03 03:15 PM', ip: '10.0.0.5', location: 'London, UK' },
    { activity: 'Changed password', dateTime: '2025-04-01 09:30 AM', ip: '172.16.0.10', location: 'San Francisco, USA' },
  ];

  // Static data for the accounts based on the description
  const accounts = [
    { id: 1, label: 'Binance Artcenter1', type: 'Spot', exchange: 'Binance', apiKeyMasked: '****...****' },
    { id: 2, label: 'crypto9ight Binance', type: 'Futures', exchange: 'Binance', apiKeyMasked: '****...****' },
    { id: 3, label: 'KuCoin crypto9ight', type: 'Spot', exchange: 'KuCoin', apiKeyMasked: '****...****' },
  ];

  const sidebarItems = [
    'User Profile',
    'Preferences',
    'Plan & Subscription',
    'Change Password',
    'Security (2FA)',
    'My Accounts',
  ];

  // Removed static activeItem, using activeSection state now

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-200">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-6 border-r border-gray-700">
        <nav>
          <ul>
            {sidebarItems.map((item) => (
              <li key={item} className="mb-4">
                <button
                  onClick={() => setActiveSection(item)}
                  className={`w-full text-left block px-4 py-2 rounded ${
                    item === activeSection
                      ? 'bg-blue-600 text-white' // Active item style
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white' // Inactive item style
                  }`}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-semibold mb-8 text-white">{activeSection}</h1>

        {/* General Section */}
        {/* Conditionally render sections based on activeSection */}
        {activeSection === 'User Profile' && (
          <>
            {/* General Section */}
            <section className="mb-10 bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-300 border-b border-gray-600 pb-2">General Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Name</label>
              <input
                type="text"
                id="name"
                value="Vincent" // Static data
                readOnly // Make it read-only as per static requirement
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input
                type="email"
                id="email"
                value="artcenter1@gmail.com" // Static data
                readOnly // Make it read-only as per static requirement
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800">
            SAVE CHANGES
          </button>
            </section>

            {/* Activity Log Section */}
            <section className="mb-10 bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-300 border-b border-gray-600 pb-2">Activity Log</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-750">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Activity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date/Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IP Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {activityLog.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{log.activity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{log.dateTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{log.ip}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{log.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </section>
          </>
        )}

        {activeSection === 'Preferences' && (
          <section className="mb-10 bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-6 text-gray-300 border-b border-gray-600 pb-3">Preferences</h2>

          {/* Email Preferences */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-400 mb-4">Email</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="email-snapshot"
                  name="email-prefs"
                  type="checkbox"
                  // Checked based on image description
                  defaultChecked
                  className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                <label htmlFor="email-snapshot" className="ml-3 block text-sm text-gray-300">
                  Receive weekly Crypto Snapshot emails
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="email-portfolio"
                  name="email-prefs"
                  type="checkbox"
                  // Checked based on image description
                  defaultChecked
                  className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                <label htmlFor="email-portfolio" className="ml-3 block text-sm text-gray-300">
                  Include my portfolio stats
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="email-bots"
                  name="email-prefs"
                  type="checkbox"
                  // Unchecked based on image description (assuming if not mentioned as checked)
                  className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                <label htmlFor="email-bots" className="ml-3 block text-sm text-gray-300">
                  Include performance summary of my running bots
                </label>
              </div>
            </div>
          </div>

          {/* Interface Preferences */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-400 mb-3">Interface</h3>
              <fieldset className="mt-2">
                <legend className="sr-only">Theme selection</legend>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      id="theme-dark"
                      name="theme"
                      type="radio"
                      // Checked based on image description
                      defaultChecked
                      className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                    />
                    <label htmlFor="theme-dark" className="ml-2 block text-sm text-gray-300">
                      Dark
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="theme-light"
                      name="theme"
                      type="radio"
                      className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                    />
                    <label htmlFor="theme-light" className="ml-2 block text-sm text-gray-300">
                      Light
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Order Notifications */}
            <div>
              <h3 className="text-lg font-medium text-gray-400 mb-3">Order Notifications</h3>
               <fieldset className="mt-2">
                <legend className="sr-only">Order notification selection</legend>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      id="notif-on"
                      name="order-notifications"
                      type="radio"
                      // Checked based on image description
                      defaultChecked
                      className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                    />
                    <label htmlFor="notif-on" className="ml-2 block text-sm text-gray-300">
                      On
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="notif-off"
                      name="order-notifications"
                      type="radio"
                      className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                    />
                    <label htmlFor="notif-off" className="ml-2 block text-sm text-gray-300">
                      Off
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>
          </div>

          {/* Other Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
             <div>
                <label htmlFor="display-currency" className="block text-sm font-medium text-gray-400 mb-1">Display Currency</label>
                <select
                  id="display-currency"
                  name="display-currency"
                  // Static value based on image description
                  defaultValue="USD"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-200"
                >
                  <option>USD</option>
                  {/* Add other currencies later if needed */}
                </select>
              </div>
              <div>
                <label htmlFor="chart-timeframe" className="block text-sm font-medium text-gray-400 mb-1">Default Chart Timeframe</label>
                 <select
                  id="chart-timeframe"
                  name="chart-timeframe"
                  // Placeholder value, update if specified in image
                  defaultValue="1H"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-200"
                >
                  <option>15m</option>
                  <option>1H</option>
                  <option>4H</option>
                  <option>1D</option>
                  {/* Add other timeframes later if needed */}
                </select>
              </div>
              <div>
                <label htmlFor="hide-balances" className="block text-sm font-medium text-gray-400 mb-1">Hide Small Balances (&lt;)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                   <input
                    type="number"
                    name="hide-balances"
                    id="hide-balances"
                    // Static value based on image description
                    defaultValue="0.01"
                    step="0.01" // Allow decimal input
                    className="block w-full pl-3 pr-12 sm:text-sm bg-gray-700 border-gray-600 rounded-md py-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">
                      USD
                    </span>
                  </div>
                </div>
              </div>
          </div>

           {/* Save Button - Placeholder, functionality later */}
           <div className="mt-8 pt-5 border-t border-gray-600">
              <div className="flex justify-end">
                 <button
                    type="button" // Change to submit later
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    SAVE PREFERENCES
                  </button>
              </div>
           </div>
          </section>
        )}

        {activeSection === 'Plan & Subscription' && (
          <section className="mb-10 bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-6 text-gray-300 border-b border-gray-600 pb-3">Plan & Subscription</h2>

          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-400 mb-4">Change Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Advanced Plan */}
              <div className="border border-gray-600 rounded-lg p-4 flex flex-col justify-between bg-gray-750 hover:border-blue-500 transition-colors duration-200">
                <div>
                  <h4 className="text-md font-semibold text-blue-400 mb-2">ADVANCED</h4>
                  <p className="text-sm text-gray-400 mb-4">Unlock powerful analytics, priority support, and advanced bot strategies.</p>
                </div>
                <div className="mt-auto">
                   <select
                    defaultValue="monthly"
                    className="block w-full pl-3 pr-10 py-2 text-sm bg-gray-700 border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md text-gray-200 mb-3"
                  >
                    <option value="monthly">$19.99 / month</option>
                    <option value="yearly">$199.99 / year (Save 16%)</option>
                  </select>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800">
                    UPGRADE
                  </button>
                </div>
              </div>

              {/* Pro Plan (Current) */}
              <div className="border-2 border-green-500 rounded-lg p-4 flex flex-col justify-between bg-gray-750 relative">
                 <span className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-md">
                    Current Plan
                  </span>
                <div>
                  <h4 className="text-md font-semibold text-green-400 mb-2">PRO</h4>
                  <p className="text-sm text-gray-400 mb-4">Enhanced features including real-time data, multiple bots, and community access.</p>
                </div>
                <div className="mt-auto">
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 mb-2">
                    Free Trial
                  </button>
                   <p className="text-xs text-gray-500 text-center">Trial expires on 2025-05-04</p>
                </div>
              </div>

              {/* Free Plan */}
              <div className="border border-gray-600 rounded-lg p-4 flex flex-col justify-between bg-gray-750 hover:border-yellow-500 transition-colors duration-200">
                <div>
                  <h4 className="text-md font-semibold text-yellow-400 mb-2">FREE</h4>
                  <p className="text-sm text-gray-400 mb-4">Basic features for getting started with crypto trading and bot usage.</p>
                </div>
                <div className="mt-auto">
                  <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800">
                    DOWNGRADE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Full Plan Details Link */}
          <div className="mt-8 pt-5 border-t border-gray-600 text-center">
             <p className="text-sm text-gray-400 mb-3">Need more information about what each plan offers?</p>
             <button className="px-5 py-2 border border-blue-500 text-blue-400 rounded-md text-sm hover:bg-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200">
                VIEW FULL PLAN DETAILS
             </button>
          </div>
          </section>
        )}

        {/* Render other sections similarly when their components/content are ready */}
        {/* Example placeholders: */}
        {activeSection === 'Change Password' && (
          <section className="mb-10 bg-gray-800 p-6 rounded-lg border border-gray-700">
            {/* Section Title (matches sidebar) */}
            <h2 className="text-xl font-semibold mb-6 text-gray-300 border-b border-gray-600 pb-3">Change Password</h2>

            {/* Form Content */}
            <div className="max-w-md"> {/* Optional: Constrain width for better form layout */}
              <h3 className="text-lg font-medium text-gray-400 mb-4">Update Your Password</h3> {/* Form sub-header */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    id="current-password"
                    name="current-password"
                    autoComplete="current-password"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your current password"
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                  <input
                    type="password"
                    id="new-password"
                    name="new-password"
                    autoComplete="new-password"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your new password"
                  />
                   {/* Optional: Add password strength indicator later */}
                </div>
                <div>
                  <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirm-new-password"
                    name="confirm-new-password"
                    autoComplete="new-password"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 pt-5 border-t border-gray-600 flex justify-start"> {/* Changed justify-end to justify-start based on common form layouts */}
                <button
                  type="button" // Change to submit later
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 font-medium"
                >
                  SAVE CHANGES {/* Changed from UPDATE PASSWORD to match image description */}
                </button>
              </div>
            </div>
          </section>
        )}
        {activeSection === 'Security (2FA)' && (
          <section className="mb-10 bg-gray-800 p-6 rounded-lg border border-gray-700">
            {/* Section Title (matches sidebar, but image shows "Account Security") */}
            <h2 className="text-xl font-semibold mb-6 text-gray-300 border-b border-gray-600 pb-3">Account Security</h2>

            {/* 2 Factor Authentication Subsection */}
            <div className="bg-gray-750 p-5 rounded-md border border-gray-600">
              <h3 className="text-lg font-medium text-gray-300 mb-3">2 Factor Authentication</h3>
              <p className="text-sm text-gray-400 mb-4">
                Enhance your account security by enabling Two-Factor Authentication (2FA). This adds an extra layer of protection by requiring a code from your authenticator app or SMS when logging in.
              </p>
              <div className="flex justify-start"> {/* Align button to the left */}
                <button className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800">
                  ENABLE
                </button>
              </div>
            </div>
          </section>
        )}
        {activeSection === 'My Accounts' && (
          <section className="mb-10 bg-gray-800 p-6 rounded-lg border border-gray-700">
            {/* Section Title is handled by the main H1 */}
            {/* External Accounts Subsection */}
            <div className="mb-6 pb-4 border-b border-gray-600">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-300">External Accounts</h2>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-800">
                    SYNC ALL ACCOUNTS
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800">
                    ADD ACCOUNT
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Manage your connected exchange API keys. Add new keys or remove existing ones.
              </p>
            </div>

            {/* Accounts Table/List */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-750">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Label</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Exchange</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">API Key</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">{account.label}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{account.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{account.exchange}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">{account.apiKeyMasked}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {/* Placeholder for Delete button/icon */}
                        <button className="text-red-500 hover:text-red-400">
                          {/* Using text for now, replace with icon later if needed */}
                          DELETE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Add message if accounts array is empty later */}
          </section>
        )}


        {/* Danger Zone Section - Assuming this is always visible or handled separately */}
        {/* If it should only show under 'User Profile' or another section, adjust the conditional rendering */}
        <section className="bg-red-900 bg-opacity-20 border border-red-500 p-6 rounded-lg mt-10">
          <h2 className="text-xl font-semibold mb-4 text-red-400">Danger Zone</h2>
          <p className="text-sm text-red-300 mb-4">
            Deleting your account is a permanent action and cannot be undone. All your data, including profile information, trading history, and settings, will be permanently removed.
          </p>
          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-900 bg-opacity-80">
            DELETE ACCOUNT
          </button>
        </section>
      </main>
    </div>
  );
};

export default UserProfilePage;