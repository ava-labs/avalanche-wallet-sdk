export function createCSVContent(rows: string[][]) {
    let csvContent = '';
    rows.forEach(function (arr) {
        let row = arr.join(',');
        csvContent += row + '\r\n';
    });
    return csvContent;
}
