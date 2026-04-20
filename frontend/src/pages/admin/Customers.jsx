import React, { useState, useEffect } from 'react';
import { Search, Users, Mail, Phone, Calendar, Gift } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { getAllCustomers, searchCustomers } from '../../api/client.js';
import { formatDate } from '../../utils/formatDate.js';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      } else {
        setFilteredCustomers(customers);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await getAllCustomers();
      setCustomers(response.data || []);
      setFilteredCustomers(response.data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await searchCustomers(searchQuery);
      setFilteredCustomers(response.data || []);
    } catch (err) {
      console.error('Error searching customers:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-[#222222]">Customers</h1>
        <div className="text-sm text-[#717171]">
          Total: <span className="font-semibold text-[#222222]">{customers.length}</span> registered customers
        </div>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#717171]" />
          <input
            type="text"
            placeholder="Search customers by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#DDDDDD] rounded-lg focus:outline-none focus:border-[#222222]"
          />
        </div>
      </Card>

      {/* Customers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F7F7F7]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Loyalty Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#717171] uppercase">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDDDD]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-[#717171]">
                    <Users className="w-12 h-12 text-[#DDDDDD] mx-auto mb-3" />
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.customer_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-[#222222]">#{customer.customer_id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#222222] rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {customer.first_name[0]}{customer.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#222222]">
                            {customer.first_name} {customer.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-[#222222] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#717171]" />
                          {customer.email}
                        </p>
                        <p className="text-[#717171] flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Gift className="w-4 h-4 text-[#FF385C]" />
                        <span className="text-sm font-medium text-[#222222]">
                          {customer.loyalty_points} points
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#717171]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(customer.created_at)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminCustomers;
