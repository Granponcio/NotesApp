var app = angular.module('myApp',['ngFileUpload']);

//-----Function to filter the list of notes --------
app.filter('searchFilter', function ($filter) {
     
    return function (items, searchfilter) {
        var isSearchFilterEmpty = true;
        angular.forEach(searchfilter, function (searchstring) {
            if (searchstring != null && searchstring != "") {
                isSearchFilterEmpty = false;
            }
        });
        if (!isSearchFilterEmpty) {
            var result = [];
            angular.forEach(items, function (item) {
                var isFound = false;
                angular.forEach(item, function (term, key) {
                    if (term != null && !isFound) {
                        term = term.toString();
                        term = term.toLowerCase();
                        angular.forEach(searchfilter, function (searchstring) {
                            searchstring = searchstring.toLowerCase();
                            if (searchstring != "" && term.indexOf(searchstring) != -1 && !isFound) {
                                result.push(item);
                                isFound = true;
                            }
                        });
                    }
                });
            });
            return result;
        } else {
            return items;
        }
    }
});

app.controller("NotesController", ['$scope','$http', '$sce','$filter','Upload', function ($scope,$http,$sce,$filter, Upload) {
$scope.ListNotes=[];
$scope.SearchText="";
$scope.Notes=[];


//------Check if we have Notes in LocalStorage ------
$scope.CheckLocalStorage = function () {
     
    let items = localStorage.getItem('lstNotes')
    if(items!=null && items != "")
        $scope.ListNotes= JSON.parse(items);
    let words = localStorage.getItem('Dictionary')
    if(words != null && words != "")
        $scope.Dictionary = JSON.parse(words);

    
    };

$scope.CheckLocalStorage();
//----------EDIT DICTIONARY---------//
$scope.EditDictionary = function () {
        $("#ModalDictionary").modal('show');
    };

//--------EDIT A WORD FROM THE DICTIONARY---------//
$scope.SaveDictionaryWord = function (word) {
     
    let pos = $scope.Dictionary.map(function (e) { return e.id; }).indexOf(word.id);
    $scope.Dictionary[pos].text= word.text;

    localStorage.setItem('Dictionary', JSON.stringify($scope.Dictionary));
    };


//---------UPLOAD FILE DICTIONARY --------//
$scope.ReadFile = function () {
     
    var File = $scope.FileDictionary;
    if (File) {
      var r = new FileReader();
      r.onload = function(e) { 
          var contents = e.target.result;

       
        $scope.WordsFromFile = contents.substr(0, contents.length);
        $scope.InsertWords();
      }
      var f =r.readAsText(File);
    }
   
    };

//
$scope.InsertWords= function(){
     
    
    if($scope.WordsFromFile!= undefined){
        let separatedWords = $scope.WordsFromFile.split(",");
        //Clean the object dictionary
        $scope.Dictionary= [];
        //Add the words and generate ids
        for(let i = 0; i< separatedWords.length-1; i++){
            let value = {'id':i+1,'text':separatedWords[i]};
            $scope.Dictionary.push(value);
        }
        localStorage.setItem('Dictionary', JSON.stringify($scope.Dictionary));
        swal("Success!", "Your dictionary has been updated!", "success");
    }



}
//-----------------ADD NEW NOTE -----------//
$scope.AddNewNote = function () {
        $scope.Note = [];
        $("#ModalNote").modal('show');
    };
//-----------------SAVE NOTE -----------//
$scope.SaveNote = function () {

        $scope.$broadcast('show-errors-check-validity', $scope.NotesForm);
         
        if($scope.NotesForm.$valid)
        {
            var idNote = $scope.getNextId();

            if($scope.Note.id == undefined){
                //this means we are creating a new note
                if(idNote==1){
                //First note to be entered in LocalStorage
                let objNote = [{'id': idNote, 'title':$scope.Note.title, 'text':$scope.Note.text}];
                localStorage.setItem('lstNotes', JSON.stringify(objNote));
                //Push the new note, to the list of notes to display
                $scope.ListNotes= objNote;

                //Clear the Note object and hide the modal
                $scope.ClearAndHide();
                }
                else{
                     
                    //If this lines hits, it means that we already have Notes in our localStorage
                     let items = localStorage.getItem('lstNotes')
                     let objNote = JSON.parse(items);
                     //Creating the new note Object
                     let ObjNew = {'id': idNote, 'title':$scope.Note.title, 'text':$scope.Note.text};

                     objNote.push(ObjNew);
                     $scope.ListNotes= objNote;

                     localStorage.setItem('lstNotes', JSON.stringify(objNote));

                     //Clear the Note object and hide the modal
                    $scope.ClearAndHide();
                }
            }
            else{
                //Editing an element already exist
                let items = localStorage.getItem('lstNotes')
                let objNote = JSON.parse(items);

                var pos = objNote.map(function (e) { return e.id; }).indexOf($scope.Note.id);
                objNote[pos].title = $scope.Note.title;
                objNote[pos].text= $scope.Note.text;

                localStorage.clear();

                localStorage.setItem('lstNotes', JSON.stringify(objNote));

                $scope.ClearAndHide();
                $scope.CheckLocalStorage();

            }
            
        }
        else{
            if($scope.NotesForm.title.$invalid)

            swal("¡Alert!", "Please fill al the fields.", "warning");

        }
    };    

//---------------METHOD TO REPLACE THE WORDS WITH THE DICTIONARY AND GIVEN RULES ------------//
$scope.ReplaceText = function(event){
     
    //Detect if the barspace is pressed
    if(event.keyCode === 32){
            var arrWords = ($scope.Note.text).split(" ");
            var textWrited = arrWords[arrWords.length-1];
            //First validation: The sentence start with a capital letter
            if(arrWords.length == 1){
                let textWord= arrWords[0];
                textWord = (textWord.charAt(0).toUpperCase()) +""+ (textWord.slice(1).toLowerCase());
                $scope.Note.text = textWord;
            }
            else{
                //This part replace the existing word with mayus and minus, with the correct value from the dictionary

                var indExistWord  = $scope.Dictionary.map(function (e) { return(e.text.toLowerCase()); }).indexOf(textWrited.toLowerCase());
                if(indExistWord != -1){
                    $scope.Note.text.replace(textWrited, $scope.Dictionary[indExistWord].text);
                    var FinalText = $scope.Note.text.split(" ");
                    var OriginalWord = $scope.Dictionary[indExistWord].text;
                    FinalText.splice(FinalText.length-1, 1);
                    $scope.Note.text = FinalText.join(" ");
                    $scope.Note.text = $scope.Note.text+" "+ OriginalWord;
                    console.log($scope.Note.text);
                }
                else{
                    //When hit this line, it means the word given doesnt exist in dictionary
                    arrWords = ($scope.Note.text).split(" ");
                    //If its all in upper case, we will leave it like that, otherwise will become lowecase
                    if( !(textWrited === textWrited.toUpperCase()) ){
                        arrWords.splice(arrWords.length-1, 1);
                        $scope.Note.text = arrWords.join(" ");
                        $scope.Note.text = $scope.Note.text+" "+ textWrited.toLowerCase();
                    }
                }
            }
        }
};

//---------------SEARCH METHOD----------//
$scope.Search = function(){
        $scope.Filter = [];
         
        $scope.Filter.push($scope.SearchText);


};


//-----------------EDIT NOTE -----------//
$scope.ViewNote = function (note) {
         
        $("#ModalNote").modal('show');
        //Clone the note object, to no change the original
        var previousobj =jQuery.extend({}, note);
        $scope.Note = previousobj;

    };

//-----------------DELETE NOTE -----------//
$scope.DeleteNote = function (note) {
         
        swal({
          title: "Are you sure?",
          text: "You will not be able to recover this note!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, delete it!",
          cancelButtonText: "Cancel!",
          closeOnConfirm: false,
          closeOnCancel: false
        },
        function(isConfirm){
          if (isConfirm) {
             

            $scope.DeleteAndResetIds(note);




            swal("Deleted!", "Your note has been deleted.", "success");
          } else {
            swal("Cancelled", "Your note still available", "error");
          }
        });


    };
//-------------CHANGE COLOR NOTES------------//
$scope.ChangeNoteColor = function (colorclass) {
         
        $(".noteGallery").removeClass('c1');
        $(".noteGallery").removeClass('c2');
        $(".noteGallery").removeClass('c3');
        $(".noteGallery").removeClass('c4');
        $(".noteGallery").removeClass('c5');
        $(".noteGallery").removeClass('c6');
        $(".noteGallery").addClass(colorclass);

        //localStorage.setItem('ColorNotes', colorclass);


    };
    
$scope.DisplayPalette = function (colorclass) {
         
        swal("¡Alerta!", "Favor de completar los campos marcados en rojo.", "warning");
        $("#note").addClass(colorclass);


    };
//-----------------------FUNCTIONS ---------------- //

$scope.ClearAndHide = function () {
        $scope.Note=[];
        $("#ModalNote").modal('hide');
    };
$scope.ClearLocalStorage = function () {
        localStorage.setItem('lstNotes', "");
        localStorage.setItem('Dictionary', "");
    };
    
$scope.DeleteContent = function () {
         swal({
          title: "Are you sure?",
          text: "This will delete all you have in the LocalStorage!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, delete it!",
          cancelButtonText: "Cancel!",
          closeOnConfirm: false,
          closeOnCancel: false
        },
        function(isConfirm){
          if (isConfirm) {
             

            $scope.ClearLocalStorage();




            swal("Deleted!", "The LocalStorage now its empty.", "success");
          } else {
            swal("Cancelled", "The LocalStorage is safe!", "error");
          }
        });
    };

$scope.DeleteAndResetIds = function(note){
     
            let checkListNotes = localStorage.getItem('lstNotes');
            let objNote = JSON.parse(checkListNotes);

            let pos = objNote.map(function (e) { return e.id; }).indexOf(note.id);
            objNote.splice(pos, 1);
            
            $scope.ClearLocalStorage();


            for(var i=0; i<objNote.length; i++){
                objNote[i].id = (i+1);
            }
            $scope.ListNotes = [];
            $scope.ListNotes = objNote;
            $scope.$apply();

            localStorage.setItem('lstNotes', JSON.stringify(objNote));
            $scope.CheckLocalStorage();



};
$scope.getNextId = function () {
         
        let existingNotes = localStorage.getItem('lstNotes');
        //If this is true, it means that we dont have notes in our localStorage
        //so, we will return 1 as an id
        if(existingNotes == null || existingNotes == ""){
            return 1;
        }
        else{
        // this means we have at least 1 note stored, we are gonna get the length with the purpose to return the next id
            let checkListNotes = localStorage.getItem('lstNotes');
            let parsedList = JSON.parse(checkListNotes);
            return (parsedList.length+1);
        }



    };

    $scope.uploadFiles = function(file, errFiles) {
         
        if(file!= undefined){
            $scope.FileDictionary = file;
            $scope.ReadFile();
        }
        
        
    }
}]);

app.directive('popover', function ($compile){

    return{
        restrict :'A',
        link: function(scope, elem){
            var content = $("#ColorPalette").html();
            var compileContent = $compile(content)(scope);
            var title = "Change notes color";
            var options = {
                content: compileContent,
                html:true,
                title:"Change notes color",

            };
            $(elem).popover(options);
        }
    }
});

