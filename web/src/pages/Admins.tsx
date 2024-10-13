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
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/themed/ui-kit/table.tsx'
import { Button } from '../components/themed/ui-kit/button.tsx'

import { ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import SectionHeader from '../components/themed/components/SectionHeader.tsx'
import { CaretDownIcon, CaretSortIcon, CaretUpIcon } from '@radix-ui/react-icons'
import { useLoaderData } from 'react-router-dom'
import { AdminTableRow } from '../api/admins.ts'

const Admins = () => {
	const admins: AdminTableRow[] = useLoaderData() as AdminTableRow[]
	const [sorting, setSorting] = useState<SortingState>([])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		'uid': false,
	})
	const [rowSelection, setRowSelection] = useState({})
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	})
	
	const tableColumns: ColumnDef<AdminTableRow>[] = [
		{
			header: 'UID',
			accessorKey: 'uid',
		},
		{
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => {
						const isSorted = column.getIsSorted()
						if (isSorted === 'desc') {
							column.clearSorting()
						} else {
							column.toggleSorting(column.getIsSorted() === 'asc')
						}
					}}
				>
					Full Name
					{
						column.getIsSorted() === false ?
							<CaretSortIcon className="ml-2 h-4 w-4" /> :
							column.getIsSorted() === 'asc' ?
								<CaretUpIcon className="ml-2 h-4 w-4" /> :
								<CaretDownIcon className="ml-2 h-4 w-4" />
					}
				</Button>
			),
			accessorKey: 'full_name',
			cell: ({ row }) => {
				return <div className="py-1">{row.getValue('full_name')}</div>
			},
		},
		{
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => {
						const isSorted = column.getIsSorted()
						if (isSorted === 'desc') {
							column.clearSorting()
						} else {
							column.toggleSorting(column.getIsSorted() === 'asc')
						}
					}}
				>
					Email
					{
						column.getIsSorted() === false ?
							<CaretSortIcon className="ml-2 h-4 w-4" /> :
							column.getIsSorted() === 'asc' ?
								<CaretUpIcon className="ml-2 h-4 w-4" /> :
								<CaretDownIcon className="ml-2 h-4 w-4" />
					}
				</Button>
			),
			accessorKey: 'email',
			cell: ({ row }) => {
				return <div className="py-1">{row.getValue('email')}</div>
			},
		},
		{
			header: 'Mobile Number',
			accessorKey: 'mobile_number',
			cell: ({ row }) => <div className="py-1">{row.getValue('mobile_number')}</div>,
		},
	]
	
	const tableInstance = useReactTable({
		columns: tableColumns,
		data: admins,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		autoResetPageIndex: false,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination,
		},
		onPaginationChange: setPagination,
	})
	
	return (
		<section className="w-full h-full flex flex-col gap-10">
			<SectionHeader text="Admins Management" />
			<div className="w-full flex flex-col">
				<div className="rounded-2xl border border-input">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								{
									tableInstance.getHeaderGroups()?.map((headerGroup) => (
										<>
											{
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
											}
										</>
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
									<TableCell colSpan={tableColumns.length} className="p-2 text-center">
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

export default Admins
