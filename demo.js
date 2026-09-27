 const input = document.getElementById('inputfile');
 input.addEventListener('change', function(event) {
    
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const emailist = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(emailist);
       
      
    };
    reader.readAsBinaryString(file);
   
 });
