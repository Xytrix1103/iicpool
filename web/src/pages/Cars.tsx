import { useLoaderData } from 'react-router-dom'
import { CarTableRow } from '../api/cars.ts'
import { useState } from 'react'
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
import { Profile } from '../components/firebase/schema.ts'
import { Button } from '../components/themed/ui-kit/button.tsx'
import { ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import SectionHeader from '../components/themed/components/SectionHeader.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/themed/ui-kit/table.tsx'

const Cars = () => {
	const cars = useLoaderData() as CarTableRow[]
	const [sorting, setSorting] = useState<SortingState>([])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		'id': false,
	})
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 6,
	})
	
	const tableColumns: ColumnDef<CarTableRow>[] = [
		{
			header: 'ID',
			accessorKey: 'id',
		},
		{
			header: 'Photo',
			accessorKey: 'photo_url',
			cell: ({ row }) => {
				return <img src={row.getValue('photo_url')} alt="Car" className="w-auto h-16" />
			},
		},
		{
			header: 'Number Plate',
			accessorKey: 'plate',
			cell: ({ row }) => {
				return <div className="py-1">{row.getValue('plate')}</div>
			},
		},
		{
			header: 'Brand',
			accessorKey: 'brand',
			cell: ({ row }) => {
				return <div className="py-1">{row.getValue('brand')}</div>
			},
		},
		{
			header: 'Model',
			accessorKey: 'model',
			cell: ({ row }) => {
				return <div className="py-1">{row.getValue('model')}</div>
			},
		},
		{
			header: 'Color',
			accessorKey: 'color',
			cell: ({ row }) => {
				return <div className="py-1">{row.getValue('color')}</div>
			},
		},
		{
			header: 'Owner',
			accessorKey: 'ownerData',
			cell: ({ row }) => {
				return <div className="py-1">{row.getValue<Profile>('ownerData').full_name}</div>
			},
		},
	]
	
	const tableInstance = useReactTable({
		columns: tableColumns,
		data: cars || [],
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
		<section className="w-full h-full flex flex-col gap-[1rem]">
			<SectionHeader
				text="Cars Management"
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

export default Cars
