import Excel from 'exceljs'
import { saveAs } from 'file-saver'
import { alignment, border, dataValidation, fill, lock, cancelled } from '../../../../utils/exporterSettings/exporterConsts';
import metadataHeaders from '../../../../utils/constants/metadataHeaders.json'
import { excelProps } from '../../../../types/bulk/bulkOperations';
import { separateByMonth } from '../../../../utils/attendance/separateByMonth';
import { dfHeaders } from '../../../../utils/constants/dfHeaders';
import { Modules } from 'dhis2-semis-types';
import { generateValidationSheet } from '../../../../utils/common/generateValidationSheet';
import { convertNumberToLetter } from '../../../../utils/common/convertNumberToLetter';
import { SchoolCalendarType } from '../../../../types/dataStore/schoolCalendar';

export function generateFile({ unavailableDays, config }: { unavailableDays: (date: Date, config: SchoolCalendarType) => boolean, config: SchoolCalendarType }) {
    const password = '#saudigitus_SEMIS_Export#'

    async function excelGenerator(props: excelProps) {
        let sheet: any = {};
        const regex = /^\d{4}-\d{2}-\d{2}$/
        const workbook = new Excel.Workbook();
        const { headers, rows, filters, metadata, module, empty, defaultLockedHeaders, fileName } = props
        const workSheets = { ...(module === Modules.Attendance ? separateByMonth(headers.find(x => x.name === 'Attendance').headers) : { [module]: module }) }
        const { validationHeaders, validationRows } = generateValidationSheet(filters)

        // Column-key -> hint text, used to add cell notes / input prompts guiding
        // users on how to fill in each column (format, required, dropdown, etc.).
        const noteByKey: Record<string, string> = {}
        headers.forEach(section => {
            (section.name === 'Attendance' ? [] : section.headers).forEach((headerInfo: any) => {
                if (headerInfo?.note) noteByKey[headerInfo.key] = headerInfo.note
            });
        });

        let validationSheet = workbook.addWorksheet('Validation', { state: 'veryHidden' })
        validationSheet.columns = validationHeaders;
        validationRows.map((row: any) => validationSheet.addRow(row))
        validationSheet.protect(password, lock)

        Object.keys(workSheets).map((workSheet) => {
            let columns: any = [], colIndex = 1, counter = 0
            let rowsToBlock: any[] = []
            sheet = workbook.addWorksheet(workSheet)

            headers.forEach(section => {
                (section.name == 'Attendance' ? workSheets[workSheet] : section.headers).forEach((headerInfo: any) => {
                    columns.push({
                        header: section.name,
                        key: headerInfo.key,
                        width: headerInfo.width,
                        subHeader: headerInfo.header,
                    });
                });
            });

            sheet.columns = columns;

            // Add the subheaders to the second row
            let thirdRow = sheet.getRow(3);
            thirdRow.values = columns.map((x: any) => x.key)
            thirdRow.hidden = true
            thirdRow.eachCell((cell: any) => {
                cell.protection = { locked: true };
            });

            let secondRow = sheet.getRow(2);
            secondRow.values = columns.map((col: any) => col.subHeader);

            // Merge cells in the first row for headers with multiple subheaders 
            headers.forEach(section => {
                const mergeCount = (section.name == 'Attendance' ? workSheets[workSheet] : section.headers).length;

                if (mergeCount > 1) {
                    sheet.mergeCells(1, colIndex, 1, colIndex + mergeCount - 1);
                }

                const cell = sheet.getCell(1, colIndex);
                cell.fill = { fgColor: { argb: section.fill }, ...fill as unknown as any }
                cell.border = border as unknown as any
                cell.font = { bold: true };
                cell.alignment = alignment as unknown as any;

                colIndex += mergeCount;
            });

            headers.map((section) => {
                (section?.name == 'Attendance' ? workSheets[workSheet] : section.headers).map((headerInfo: any) => {
                    counter++

                    const cell = secondRow.getCell(counter);
                    cell.fill = { fgColor: { argb: section.fill }, ...fill as unknown as any }
                    cell.border = border as unknown as any
                    cell.font = { bold: true };
                    // Hover-over hint on the column title, e.g. expected format,
                    // required, or "select from dropdown".
                    if (headerInfo?.note) cell.note = headerInfo.note;
                })
            })

            rows.forEach(rowData => {
                const { enrollmentStatus, ...rowContent } = rowData;
                sheet.addRow(rowContent);
            })

            sheet.getRow(2).eachCell((headerCell: any, colIndex: number) => {
                const columnHeader = headerCell.value;
                const colKey = sheet.getColumn(colIndex)._key
                const index = dfHeaders.findIndex((x: any) => x.key === colKey)
                const col = sheet.getColumn(colIndex)
                col.numFmt = '@'

                if (index !== -1 || colKey === 'dataElements') col.hidden = true

                sheet.eachRow((row: any, index: number) => {
                    const dataElementId = colKey.split(".")
                    const cell = row.getCell(colIndex);

                    if (!rowsToBlock.includes(row._number) && colKey === 'ref') {
                        const status = rows?.find(x => x.ref == row?.getCell(colIndex)?.value)?.enrollmentStatus
                        if (status === 'CANCELLED' && module != Modules.Final_Result) rowsToBlock.push(row._number)
                    }

                    if (index > 2) {
                        if (empty && colKey !== 'ref') {
                            if (defaultLockedHeaders.includes(cell._column._key)) {
                                cell.protection = { locked: true };
                            } else {
                                cell.protection = { locked: false };
                            }
                        } else if (
                            defaultLockedHeaders.includes(cell._column._key) ||
                            defaultLockedHeaders.includes(cell._column._header)
                        ) {
                            cell.protection = { locked: true };
                        } else {
                            cell.protection = { locked: false };
                        }
                    }

                    if (filters?.[dataElementId[0]] || filters?.[dataElementId[1]] || (regex.test(columnHeader) && filters["Attendance"])) {
                        if (index > 2) {
                            const colFilter = filters?.[dataElementId[1]] ?? filters?.[dataElementId[0]] ?? filters["Attendance"]
                            const columnLetter = convertNumberToLetter(validationSheet.getColumn(regex.test(columnHeader) ? 'Attendance' : dataElementId?.[1] ?? dataElementId?.[0]).number);
                            const formula = `'${validationSheet.name}'!$${columnLetter}$2:$${columnLetter}$${colFilter.split(',').length + 1}`;
                            const columnHint = noteByKey[colKey];

                            cell.dataValidation = {
                                ...dataValidation,
                                formulae: [formula],
                                ...(columnHint ? { promptTitle: String(columnHeader), prompt: columnHint } : {})
                            };
                        }
                    }
                });
            });

            if (module === Modules.Attendance)
                sheet.eachRow({ includeEmpty: true }, (row: any) => {
                    row.eachCell({ includeEmpty: true }, (cell: any) => {
                        if (regex.test(cell._column._key) && cell._row._number > 3) {
                            if (unavailableDays != undefined && unavailableDays(new Date(cell._column._key), config)) {

                                cell.dataValidation = null
                                cell.value = 'Non School Day'
                                cell.fill = { fgColor: { argb: 'f8f9fa' }, ...fill as unknown as any }
                                cell.border = border as unknown as any
                                cell.font = { size: 10 };
                                cell.protection = { locked: true };

                            } else cell.protection = { locked: false };
                        } else if (cell._row._number > 3) {
                            cell.fill = { fgColor: { argb: 'f8f9fa' }, ...fill as unknown as any }
                            cell.border = border as unknown as any
                        }
                    });
                });

            sheet.eachRow({ includeEmpty: true }, (row: any) => {
                if (rowsToBlock.includes(row._number)) {
                    row.eachCell({ includeEmpty: true }, (cell: any) => {

                        cell.protection = cancelled.protection;
                        cell.fill = cancelled.fill
                        cell.border = border as unknown as any
                        cell.dataValidation = null

                    });
                }
            });

            sheet.protect(password, lock);
        })

        sheet = workbook.addWorksheet('Metadata')
        sheet.columns = metadataHeaders
        metadata.map((row: any) => sheet.addRow(row))
        sheet.protect(password, lock)

        const buf = await workbook.xlsx.writeBuffer()
        saveAs(new Blob([buf]), fileName + ".xlsx")
    }

    return { excelGenerator }
}