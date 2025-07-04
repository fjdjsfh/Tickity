"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../globals.css';
import { useParams } from 'next/navigation';
import { useConcertData, useAuth, useFavorite } from './hooks';
import { ConcertHeader, ConcertInfoTabs, BookingBox } from './components';
import OneTicketModal from '@/app/modal/OneTicketModal';

const ConcertDetail = () => {
  const { slug } = useParams();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [activeTab, setActiveTab] = useState('공연정보');
  const [showLimitModal, setShowLimitModal] = useState(true);

  // 커스텀 훅들 사용
  const { concert, policies, ticketInfo, loading, error } = useConcertData();
  const { userId } = useAuth();
  const { liked, favoriteLoading, handleFavoriteToggle } = useFavorite(concert, userId);

  const calendarDays = useMemo(() => {
    if (!concert?.start_date) return [];
    const start = new Date(concert.start_date);
    const year = start.getFullYear();
    const month = start.getMonth(); // 0-based
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days: Array<number | null> = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  }, [concert?.start_date]);

  useEffect(() => {
    if (concert?.start_date) {
      setSelectedDate(concert.start_date);
    }
  }, [concert]);

  const handleReservation = () => {
    if (!concert) return;
    localStorage.setItem('concertId', concert.id);
    localStorage.setItem('concertTitle', concert.title);
    localStorage.setItem('venueId', concert.venue_id);
    localStorage.setItem('selectedDate', selectedDate);
    localStorage.setItem('selectedTime', selectedTime);
    localStorage.setItem('bookingFee', concert.booking_fee.toString());

    const width = 1172, height = 812;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      '/seat',
      '_blank',
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=no,resizable=no`
    );
    if (popup) popup.focus();
  };

  // 달력 아래로 내리는 애니메이션
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabsHeight, setTabsHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (tabsRef.current) {
      setTabsHeight(tabsRef.current.scrollHeight);
    }
  }, [activeTab]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!concert || !ticketInfo) return <div className="p-6">콘서트 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="p-6 bg-white text-[#222] max-w-[1200px] mx-auto">
      {/* 모달 랜더링 */}
      {showLimitModal && (
        <OneTicketModal onClose={() => setShowLimitModal(false)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[600px_1fr] gap-20">
       {/* 콘서트 헤더 */}
        <div>
          <ConcertHeader
            ticketInfo={ticketInfo}
            liked={liked}
            favoriteLoading={favoriteLoading}
            onFavoriteToggle={handleFavoriteToggle}
          />

          <div
            style={{
              height: tabsHeight ? `${tabsHeight}px` : 'auto',
              transition: 'height 0.4s ease',
              overflow: 'hidden',
            }}
          >
            <div ref={tabsRef}>
              {/* 콘서트 정보 탭 */}
              <ConcertInfoTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                ticketInfo={ticketInfo}
                concert={concert}
                policies={policies}
              />
            </div>
          </div>
        </div>

        {/* 오른쪽 예약 박스 */}
        <div className="sticky top-10 h-fit">
          <BookingBox
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
            onReservation={handleReservation}
            concert={{
              start_date: concert.start_date,
              start_time: concert.start_time,
              ticket_open_at: concert.ticket_open_at,
            }}
            price={ticketInfo.price}
            calendarDays={calendarDays}
          />
        </div>
      </div>
    </div>
  );
};

export default ConcertDetail;
