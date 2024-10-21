import { Link, useLoaderData } from 'react-router-dom'
import { useState } from 'react'
import { RideTableRow } from '../api/rides.ts'
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
	VisibilityState,
} from '@tanstack/react-table'
import { Car, Profile, RideLocation } from '../components/firebase/schema.ts'
import SectionHeader from '../components/themed/components/SectionHeader.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/themed/ui-kit/table.tsx'
import { Button } from '../components/themed/ui-kit/button.tsx'
import { ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '../components/themed/ui-kit/tabs.tsx'

const Rides = () => {
	const rides = useLoaderData() as RideTableRow[]
	const [direction, setDirection] = useState<'to' | 'from'>('to')
	const [sorting, setSorting] = useState<SortingState>([])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		'id': false,
	})
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	})
	
	const tableColumns: ColumnDef<RideTableRow>[] = [
		{
			header: 'Created By',
			accessorKey: 'driverData',
			cell: ({ row }) => <div className="py-1">{row.getValue<Profile>('driverData').full_name}</div>,
		},
		{
			header: 'Passengers',
			accessorKey: 'passengersData',
			cell: ({ row }) => {
				return <div className="py-1">
					{
						row.getValue<Profile[]>('passengersData').length > 0 ? row.getValue<Profile[]>('passengersData').map((passenger) => (
							<div key={passenger.id} className="py-1">
								{passenger.full_name}
							</div>
						)) : '-'
					}
				</div>
			},
		},
		{
			header: `${direction === 'to' ? 'Origin' : 'Destination'}`,
			accessorKey: 'location',
			cell: ({ row }) => {
				return (
					<div className="py-1">
						{
							row.getValue<RideLocation>('location').name
						}
					</div>
				)
			},
		},
		{
			header: 'Date & Time',
			accessorKey: 'datetime',
			cell: ({ row }) => {
				return <div className="py-1">
					{
						//from iso string to date
						new Date(row.getValue<string>('datetime')).toLocaleString(
							'en-US',
							{
								month: 'short',
								day: '2-digit',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit',
							},
						)
					}
				</div>
			},
		},
		{
			header: 'Available Seats',
			accessorKey: 'available_seats',
			cell: ({ row }) => {
				const passengersLength = row.getValue<Profile[]>('passengersData').length
				const availableSeats = row.getValue<number>('available_seats')
				
				return (
					<div className="py-1">
						{availableSeats - passengersLength}/{availableSeats}
					</div>
				)
			},
		},
		{
			header: 'Car',
			accessorKey: 'driverCarData',
			cell: ({ row }) => {
				const number_plate = row.getValue<Car>('driverCarData').plate
				
				return (
					<div className="py-1">
						{number_plate}
					</div>
				)
			},
		},
		{
			header: 'Status',
			cell: ({ row }) => {
				const ride = row.original
				
				if (ride.completed_at) {
					if (ride.sos) {
						return <div className="py-1 text-red-500">
							SOS Completed
						</div>
					}
					return <div className="py-1 text-green-500">
						Completed
					</div>
				} else if (ride.cancelled_at) {
					return <div className="py-1 text-orange-500">
						Cancelled
					</div>
				} else if (ride.started_at) {
					if (ride.sos?.started_at) {
						return <div className="py-1 text-red-500">
							SOS Ongoing
						</div>
					} else {
						if (ride.sos?.responded_by) {
							return <div className="py-1 text-red-500">
								SOS Responded
							</div>
						}
						return <div className="py-1 text-yellow-500">
							Ongoing
						</div>
					}
				} else {
					return <div className="py-1 text-gray-500">
						Pending
					</div>
				}
			},
		},
		{
			header: 'Action',
			cell: ({ row }) => {
				return (
					<div className="py-1">
						<Link to={`/rides/${row.original.id}`}>
							<Button variant="outline" className="px-2 py-1 gap-1">
								<EyeIcon size={16} />
								<span className="ml-1">View</span>
							</Button>
						</Link>
					</div>
				)
			},
		},
	]
	
	const tableInstance = useReactTable({
		columns: tableColumns,
		data: rides.filter((ride) => {
			return ride.to_campus === (direction === 'to')
		}) as RideTableRow[],
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		autoResetPageIndex: false,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			pagination,
		},
	})
	
	return (
		<section className="w-full h-full flex flex-col gap-[2rem]">
			<SectionHeader
				text="Rides Management"
				extra={
					<Tabs
						defaultValue={direction}
						onValueChange={(value) => {
							console.log(value)
							setDirection(value as 'to' | 'from')
						}}
					>
						<TabsList>
							<TabsTrigger value="to">
								To Campus
							</TabsTrigger>
							<TabsTrigger value="from">
								From Campus
							</TabsTrigger>
						</TabsList>
					</Tabs>
				}
			/>
			<div className="w-full flex flex-col">
				<div className="rounded-2xl border border-input">
					<Table className="w-full">
						<TableHeader key="header">
							<TableRow key="header-row">
								{
									tableInstance.getHeaderGroups()?.map((headerGroup) => (
										headerGroup.headers.map((column) => (
											<TableHead key={column.id}>
												{column.isPlaceholder
													? null
													: flexRender(
														column.column.columnDef.header,
														column.getContext(),
													)}
											</TableHead>
										))
									))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{tableInstance.getRowModel().rows.length ? (
								tableInstance.getRowModel().rows.map((row) => (
									<TableRow key={row.id}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={tableColumns.length}
									           className="p-2 text-center">
										No data
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex items-center justify-end space-x-2 py-4">
					<div className="space-x-2">
						<Button
							variant="outline"
							className="px-1.5 py-1.5"
							onClick={() => tableInstance.firstPage()}
							disabled={!tableInstance.getCanPreviousPage()}
						>
							<ChevronFirstIcon size={16} color="black" />
						</Button>
						<Button
							variant="outline"
							className="px-1.5 py-1.5"
							onClick={() => tableInstance.previousPage()}
							disabled={!tableInstance.getCanPreviousPage()}
						>
							<ChevronLeftIcon size={16} color="black" />
						</Button>
						<Button
							variant="outline"
							className="px-1.5 py-1.5"
							onClick={() => tableInstance.nextPage()}
							disabled={!tableInstance.getCanNextPage()}
						>
							<ChevronRightIcon size={16} color="black" />
						</Button>
						<Button
							variant="outline"
							className="px-1.5 py-1.5"
							onClick={() => tableInstance.lastPage()}
							disabled={!tableInstance.getCanNextPage()}
						>
							<ChevronLastIcon size={16} color="black" />
						</Button>
					</div>
				</div>
			</div>
		</section>
	)
}

export default Rides
