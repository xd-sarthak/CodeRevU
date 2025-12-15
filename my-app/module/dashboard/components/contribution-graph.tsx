// Contribution graph component for dashboard
// Displays GitHub-style activity calendar showing daily coding contributions over the last year
// Uses react-activity-calendar library with theme-aware colors
// Fetches data via React Query and handles loading/empty states

"use client"
import React from 'react'
import { useTheme } from 'next-themes'
import {ActivityCalendar} from "react-activity-calendar"
import { getContributionStats } from '../actions'
import { useQuery } from '@tanstack/react-query'
const ContributionGraph = () => {
    const {theme} = useTheme();

    const {data,isLoading} = useQuery({
        queryKey: ['contribution-graph'],
        queryFn: async()=> await getContributionStats(),
        staleTime:1000*60*5
    });

    if(isLoading){
        return (
            <div className='w-full flex-col items-center justify-center p-8'>
                <div className='animate-pulse text-muted-foreground'>Loading contribution data...</div>
            </div>
        )
    }

    if(!data || !data.contributions.length){
        return (
            <div className='w-full flex flex-col items-center justify-center p-8'>
                <div className='text-muted-foreground'>No contribution data available</div>
            </div>
        )
    }



  return (
    <div className='w-full flex flex-col items-center gap-4 p-4'>
        <div className='text-sm text-muted-foreground'>
            <span>{data.totalContributions}</span>
            Contributions in the last year
        </div>

        <div className='w-full overflow-x-auto'>
            <div className='flex justify-center min-w-max px-4'>
                <ActivityCalendar
                data={data.contributions}
                colorScheme={theme==="dark" ? "dark" : "light"}
                blockSize={11}
                blockMargin={4}
                fontSize={14}
                showWeekdayLabels
                showMonthLabels
                theme={
                    {
                       light:['hsl(0,0%,92%)','hsl(142,71%,45%)'],
                       dark: ['#161b22','hsl(142,71%,45%)']
                    }
                }
                />


            </div>
        </div>
    </div>
    
  )
}

export default ContributionGraph